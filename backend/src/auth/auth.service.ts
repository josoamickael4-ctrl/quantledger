import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MembersService } from '../members/members.service';

@Injectable()
export class AuthService {
  // Code de secours administrateur en cas d'oubli de mot de passe
  private readonly ADMIN_RECOVERY_CODE = 'FA46C541-20D8-46BA-A715-35CA00F1FB4F';

  constructor(private readonly membersService: MembersService) {}

  async authenticate(accessCode: string) {
    // Vérifier d'abord le code d'accès normal
    let member = await this.membersService.findByCode(accessCode);

    // Si le code n'est pas trouvé, vérifier si c'est le code de secours administrateur
    if (!member) {
      if (accessCode === this.ADMIN_RECOVERY_CODE) {
        // Utiliser le premier admin trouvé ou créer une session admin générique
        const adminMembers = await this.membersService.findAllByRole('admin');
        if (adminMembers && adminMembers.length > 0) {
          member = adminMembers[0];
        } else {
          throw new UnauthorizedException('Code d\'accès invalide.');
        }
      } else {
        throw new UnauthorizedException('Code d\'accès invalide.');
      }
    }

    if (!member.isActive) {
      throw new UnauthorizedException('Votre accès a été désactivé. Contactez l\'administrateur.');
    }

    // Track last login timestamp
    await this.membersService.updateLastLogin(member.id);

    return {
      member,
      sessionToken: `session-${member.id}-${Date.now()}`,
      recoveryLogin: accessCode === this.ADMIN_RECOVERY_CODE ? true : false,
    };
  }
}

