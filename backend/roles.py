from enum import Enum

class UserRoles(str, Enum):
    ADMIN = "admin"
    STAFF = "STAFF"
    VISITOR = "VISITOR"


