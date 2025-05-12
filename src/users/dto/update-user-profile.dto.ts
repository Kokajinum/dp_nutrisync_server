import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfileDto } from './create-user-profile.dto';

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {
    //https://docs.nestjs.com/openapi/mapped-types
    //je to ta stejná classa, jen jsou všechny properties volitelné
    // Sem můžeme doplnit cokoliv navíc, co je specifické pro update,
}