export class CreateUserDto {
    email: string;
    password: string;
    name: string;
    role: string;
    photo?: string;
  doctorId?: string; // Optional, only for doctors
  }