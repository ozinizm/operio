from app.core import security
from app.models.user import User
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

def test_password_flow():
    password = "OperioTest123!"
    hashed = security.get_password_hash(password)
    
    print(f"Password: {password}")
    print(f"Hashed: {hashed}")
    
    verify_correct = security.verify_password(password, hashed)
    print(f"Verify correct password: {verify_correct}")
    
    verify_wrong = security.verify_password("WrongPass123!", hashed)
    print(f"Verify wrong password: {verify_wrong}")
    
    if verify_correct and not verify_wrong:
        print("Password verification logic is CORRECT.")
    else:
        print("Password verification logic is FAILED.")

if __name__ == "__main__":
    test_password_flow()
