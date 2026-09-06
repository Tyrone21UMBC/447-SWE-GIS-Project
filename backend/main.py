from fastapi import FastAPI


app = FastAPI()

# home page
@app.get("/")
async def read_root():
    return {"message": "Hello!"}

# this will be a sub page for the login screen
@app.get("/login/")
def login_screen():
    return {"message": "Login screen"}


