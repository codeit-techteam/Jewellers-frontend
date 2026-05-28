export function getStepName(step: number): string {
  switch (step) {
    case 1:
      return 'Business Information';
    case 2:
      return 'GST Certificate';
    case 3:
      return 'BIS Certificate';
    case 4:
      return 'Store Branding';
    case 5:
    case 6:
      return 'Add Products';
    case 7:
      return 'Under Review';
    default:
      return 'Registration';
  }
}
