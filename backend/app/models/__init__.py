from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import models here so Alembic can detect them
from .user import User  # noqa: E402,F401
from .doctor_patient_history import DoctorPatientHistory  # noqa: E402,F401
from .binding import DoctorPatientBinding  # noqa: E402,F401 