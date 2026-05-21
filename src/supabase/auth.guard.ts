import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.warn('AuthGuard: Missing token in authorization header');
      throw new UnauthorizedException('Missing token');
    }

    const client = this.supabase.getClient();
    console.log('AuthGuard: Attempting to verify token with client.auth.getUser(). Token prefix:', token.substring(0, 15) + '...');
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error) {
      console.error('AuthGuard: Supabase getUser error:', error.message, error.status);
    }

    if (!user) {
      console.warn('AuthGuard: No user returned for token');
    }

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user and token to request
    request.user = user;
    request.token = token;
    return true;
  }
}
