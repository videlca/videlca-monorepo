export interface UsuarioSesion {
  idUser: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  user: UsuarioSesion;
}
