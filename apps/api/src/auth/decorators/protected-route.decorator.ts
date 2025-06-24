import { SetMetadata } from '@nestjs/common';
import { DescriptionRoutes } from '../interfaces';

export const META_ROUTES = 'routes';

export const ProtectedRoute = (route: DescriptionRoutes) => {

    return SetMetadata(META_ROUTES, route);

};
