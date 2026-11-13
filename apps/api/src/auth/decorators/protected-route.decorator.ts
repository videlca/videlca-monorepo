import { SetMetadata } from '@nestjs/common';
import { DescriptionRoutes } from '../interfaces';

export const META_ROUTES = 'routes';

// Permiso(s) que dan acceso a la ruta. Con varios, basta con que el usuario tenga uno de ellos (ej: una lista de
// solo lectura que necesitan varias pantallas). En un metodo reemplaza al permiso del controller
export const ProtectedRoute = (...routes: DescriptionRoutes[]) => {

    return SetMetadata(META_ROUTES, routes);

};
