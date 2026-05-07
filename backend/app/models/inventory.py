from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Text, Float, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    sku = Column(String, nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    unit = Column(String, nullable=False) # Adet, KG, Metre, vb.
    quantity = Column(Float, default=0.0)
    min_quantity = Column(Float, default=0.0)
    purchase_price = Column(Float, nullable=True)
    sale_price = Column(Float, nullable=True)
    supplier = Column(String, nullable=True)
    warehouse_location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="active") # active, passive, low_stock, out_of_stock
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    workspace = relationship("Workspace")
    deleted_by_user = relationship("User", foreign_keys=[deleted_by_user_id])

    def update_status(self):
        if self.quantity <= 0:
            self.status = "out_of_stock"
        elif self.quantity <= self.min_quantity:
            self.status = "low_stock"
        else:
            self.status = "active"
