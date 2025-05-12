import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'macronutrientSum', async: false })
export class MacronutrientSumValidator implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    const obj = args.object as any;
    // Pokud některá z hodnot není zadána, bereme ji jako 0
    const protein = obj.protein_ratio ?? 0;
    const fat = obj.fat_ratio ?? 0;
    const carbs = obj.carbs_ratio ?? 0;
    return protein + fat + carbs <= 100;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Součet makronutrientů (protein, tuk, sacharidy) nesmí přesáhnout 100 %';
  }
}