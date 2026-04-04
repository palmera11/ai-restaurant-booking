from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
