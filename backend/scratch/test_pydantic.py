from pydantic import BaseModel, ValidationError
from typing import Optional

class T(BaseModel):
    assignee_user_id: Optional[int] = None

try:
    print(T(assignee_user_id=''))
except ValidationError as e:
    print("Error:", e)
