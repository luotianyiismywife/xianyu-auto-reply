"""
商品可选卡券服务

功能：
1. 为「商品关联卡券」选择弹窗提供服务端分页：自有卡券
2. 仅返回列表/选择所需的轻字段（不含卡密/文本/API配置/图片等大字段），
   避免卡券过多时一次性传输超大内容导致界面卡顿
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import load_only

from common.models.card import Card


class SelectableCardService:
    """商品可选卡券服务（单用户自用版：仅自有卡券）"""

    # 自有卡券轻量模式只需查询的列（避免读取 LONGTEXT 等大字段）
    _OWN_LITE_COLUMNS = (
        Card.id, Card.name, Card.type, Card.is_multi_spec,
        Card.spec_name, Card.spec_value, Card.enabled, Card.price,
    )

    def __init__(self, session: AsyncSession):
        self.session = session

    # ---------- 查询条件构建 ----------

    def _own_conditions(self, user_id: Optional[int], search: str) -> List[Any]:
        """构建自有卡券查询条件（owner 作用域 + 搜索：名称/类型/ID）"""
        conds: List[Any] = []
        if user_id is not None:
            conds.append(Card.user_id == user_id)
        if search:
            kw = f"%{search}%"
            conds.append(
                or_(
                    Card.name.ilike(kw),
                    Card.description.ilike(kw),
                    Card.type.ilike(kw),
                    cast(Card.id, String).ilike(kw),
                )
            )
        return conds

    # ---------- 语句构建 ----------

    def _own_data_stmt(self, own_conds: List[Any], offset: int, limit: int):
        """自有卡券分页数据语句（仅查询轻量列）"""
        stmt = (
            select(Card)
            .where(*own_conds)
            .order_by(Card.id.desc())
            .options(load_only(*self._OWN_LITE_COLUMNS))
            .offset(offset)
            .limit(limit)
        )
        return stmt

    # ---------- 行 → 统一项 ----------

    def _own_card_to_item(self, card: Card) -> Dict[str, Any]:
        """自有卡券 → 选择项字典"""
        return {
            "id": card.id,
            "name": card.name,
            "type": card.type,
            "source": "own",
            "dock_name": None,
            "dock_record_id": None,
            "is_multi_spec": card.is_multi_spec,
            "spec_name": card.spec_name,
            "spec_value": card.spec_value,
            "enabled": card.enabled,
            "price": card.price,
            "unique_key": f"own_{card.id}",
        }

    # ---------- 对外方法 ----------

    async def get_selectable_cards_paginated(
        self,
        item_id: str,
        user_id: Optional[int],
        page: int = 1,
        page_size: int = 50,
        search: str = "",
    ) -> Dict[str, Any]:
        """分页获取商品的可选卡券（仅自有卡券）

        Args:
            item_id: 商品ID（保留参数，便于后续按商品维度扩展；当前不参与过滤）
            user_id: 用户ID，None 表示管理员（不加 owner 过滤）
            page: 页码（从1开始）
            page_size: 每页数量
            search: 搜索关键词

        Returns:
            统一分页结构 {list, total, page, page_size, total_pages}
        """
        own_conds = self._own_conditions(user_id, search)

        own_count_stmt = select(func.count(Card.id))
        if own_conds:
            own_count_stmt = own_count_stmt.where(*own_conds)
        total = (await self.session.execute(own_count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        own_rows = (await self.session.execute(
            self._own_data_stmt(own_conds, offset, page_size)
        )).scalars().all()
        items: List[Dict[str, Any]] = [self._own_card_to_item(c) for c in own_rows]

        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return {
            "list": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def get_all_selectable_card_keys(
        self,
        user_id: Optional[int],
        search: str = "",
    ) -> List[Dict[str, Any]]:
        """获取全部匹配的可选卡券轻量项（供「全选当前筛选结果」使用，不分页）

        仅返回轻字段，不含卡密/文本等大内容；仅在用户主动点「全选」时触发。
        """
        own_conds = self._own_conditions(user_id, search)
        own_rows = (await self.session.execute(
            select(Card)
            .where(*own_conds)
            .order_by(Card.id.desc())
            .options(load_only(*self._OWN_LITE_COLUMNS))
        )).scalars().all()
        return [self._own_card_to_item(c) for c in own_rows]
