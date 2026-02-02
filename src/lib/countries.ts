export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  indicatif: string;
  flag: string;
  localLength: number; // Expected length of local number
  region: string;
}

export const COUNTRIES: Country[] = [
  // Afrique
  {
    name: "Sénégal",
    code: "SN",
    indicatif: "+221",
    flag: "🇸🇳",
    localLength: 9,
    region: "Afrique",
  },
  //   { name: "Côte d'Ivoire", code: "CI", indicatif: "+225", flag: "🇨🇮", localLength: 8, region: "Afrique" },
  //   { name: "Mali", code: "ML", indicatif: "+223", flag: "🇲🇱", localLength: 8, region: "Afrique" },
  //   { name: "Burkina Faso", code: "BF", indicatif: "+226", flag: "🇧🇫", localLength: 8, region: "Afrique" },
  //   { name: "Niger", code: "NE", indicatif: "+227", flag: "🇳🇪", localLength: 8, region: "Afrique" },
  //   { name: "Togo", code: "TG", indicatif: "+228", flag: "🇹🇬", localLength: 8, region: "Afrique" },
  //   { name: "Bénin", code: "BJ", indicatif: "+229", flag: "🇧🇯", localLength: 8, region: "Afrique" },
  //   { name: "Mauritanie", code: "MR", indicatif: "+222", flag: "🇲🇷", localLength: 8, region: "Afrique" },
  //   { name: "Guinée", code: "GN", indicatif: "+224", flag: "🇬🇳", localLength: 9, region: "Afrique" },
  //   { name: "Guinée-Bissau", code: "GW", indicatif: "+245", flag: "🇬🇼", localLength: 7, region: "Afrique" },
  //   { name: "Cap-Vert", code: "CV", indicatif: "+238", flag: "🇨🇻", localLength: 7, region: "Afrique" },
  //   { name: "Sierra Leone", code: "SL", indicatif: "+232", flag: "🇸🇱", localLength: 8, region: "Afrique" },
  //   { name: "Liberia", code: "LR", indicatif: "+231", flag: "🇱🇷", localLength: 7, region: "Afrique" },
  //   { name: "Gambie", code: "GM", indicatif: "+220", flag: "🇬🇲", localLength: 7, region: "Afrique" },
  //   { name: "Ghana", code: "GH", indicatif: "+233", flag: "🇬🇭", localLength: 9, region: "Afrique" },
  //   { name: "Nigeria", code: "NG", indicatif: "+234", flag: "🇳🇬", localLength: 10, region: "Afrique" },
  //   { name: "Cameroun", code: "CM", indicatif: "+237", flag: "🇨🇲", localLength: 9, region: "Afrique" },
  //   { name: "Tchad", code: "TD", indicatif: "+235", flag: "🇹🇩", localLength: 8, region: "Afrique" },
  //   { name: "République centrafricaine", code: "CF", indicatif: "+236", flag: "🇨🇫", localLength: 8, region: "Afrique" },
  //   { name: "République du Congo", code: "CG", indicatif: "+242", flag: "🇨🇬", localLength: 9, region: "Afrique" },
  //   { name: "République démocratique du Congo", code: "CD", indicatif: "+243", flag: "🇨🇩", localLength: 9, region: "Afrique" },
  //   { name: "Gabon", code: "GA", indicatif: "+241", flag: "🇬🇦", localLength: 7, region: "Afrique" },
  //   { name: "Guinée équatoriale", code: "GQ", indicatif: "+240", flag: "🇬🇶", localLength: 9, region: "Afrique" },
  //   { name: "Sao Tomé-et-Principe", code: "ST", indicatif: "+239", flag: "🇸🇹", localLength: 7, region: "Afrique" },
  //   { name: "Angola", code: "AO", indicatif: "+244", flag: "🇦🇴", localLength: 9, region: "Afrique" },
  //   { name: "Namibie", code: "NA", indicatif: "+264", flag: "🇳🇦", localLength: 9, region: "Afrique" },
  //   { name: "Botswana", code: "BW", indicatif: "+267", flag: "🇧🇼", localLength: 8, region: "Afrique" },
  //   { name: "Zimbabwe", code: "ZW", indicatif: "+263", flag: "🇿🇼", localLength: 9, region: "Afrique" },
  //   { name: "Zambie", code: "ZM", indicatif: "+260", flag: "🇿🇲", localLength: 9, region: "Afrique" },
  //   { name: "Malawi", code: "MW", indicatif: "+265", flag: "🇲🇼", localLength: 9, region: "Afrique" },
  //   { name: "Mozambique", code: "MZ", indicatif: "+258", flag: "🇲🇿", localLength: 9, region: "Afrique" },
  //   { name: "Madagascar", code: "MG", indicatif: "+261", flag: "🇲🇬", localLength: 9, region: "Afrique" },
  //   { name: "Comores", code: "KM", indicatif: "+269", flag: "🇰🇲", localLength: 7, region: "Afrique" },
  //   { name: "Maurice", code: "MU", indicatif: "+230", flag: "🇲🇺", localLength: 8, region: "Afrique" },
  //   { name: "Seychelles", code: "SC", indicatif: "+248", flag: "🇸🇨", localLength: 7, region: "Afrique" },
  //   { name: "Djibouti", code: "DJ", indicatif: "+253", flag: "🇩🇯", localLength: 8, region: "Afrique" },
  //   { name: "Érythrée", code: "ER", indicatif: "+291", flag: "🇪🇷", localLength: 7, region: "Afrique" },
  //   { name: "Éthiopie", code: "ET", indicatif: "+251", flag: "🇪🇹", localLength: 9, region: "Afrique" },
  //   { name: "Somalie", code: "SO", indicatif: "+252", flag: "🇸🇴", localLength: 8, region: "Afrique" },
  //   { name: "Kenya", code: "KE", indicatif: "+254", flag: "🇰🇪", localLength: 9, region: "Afrique" },
  //   { name: "Ouganda", code: "UG", indicatif: "+256", flag: "🇺🇬", localLength: 9, region: "Afrique" },
  //   { name: "Tanzanie", code: "TZ", indicatif: "+255", flag: "🇹🇿", localLength: 9, region: "Afrique" },
  //   { name: "Rwanda", code: "RW", indicatif: "+250", flag: "🇷🇼", localLength: 9, region: "Afrique" },
  //   { name: "Burundi", code: "BI", indicatif: "+257", flag: "🇧🇮", localLength: 8, region: "Afrique" },
  //   { name: "Afrique du Sud", code: "ZA", indicatif: "+27", flag: "🇿🇦", localLength: 9, region: "Afrique" },
  //   { name: "Lesotho", code: "LS", indicatif: "+266", flag: "🇱🇸", localLength: 8, region: "Afrique" },
  //   { name: "Eswatini", code: "SZ", indicatif: "+268", flag: "🇸🇿", localLength: 8, region: "Afrique" },

  //   // Europe
  //   { name: "France", code: "FR", indicatif: "+33", flag: "🇫🇷", localLength: 9, region: "Europe" },
  //   { name: "Allemagne", code: "DE", indicatif: "+49", flag: "🇩🇪", localLength: 10, region: "Europe" },
  //   { name: "Royaume-Uni", code: "GB", indicatif: "+44", flag: "🇬🇧", localLength: 10, region: "Europe" },
  //   { name: "Italie", code: "IT", indicatif: "+39", flag: "🇮🇹", localLength: 10, region: "Europe" },
  //   { name: "Espagne", code: "ES", indicatif: "+34", flag: "🇪🇸", localLength: 9, region: "Europe" },
  //   { name: "Belgique", code: "BE", indicatif: "+32", flag: "🇧🇪", localLength: 9, region: "Europe" },
  //   { name: "Pays-Bas", code: "NL", indicatif: "+31", flag: "🇳🇱", localLength: 9, region: "Europe" },
  //   { name: "Suisse", code: "CH", indicatif: "+41", flag: "🇨🇭", localLength: 9, region: "Europe" },
  //   { name: "Autriche", code: "AT", indicatif: "+43", flag: "🇦🇹", localLength: 10, region: "Europe" },
  //   { name: "Suède", code: "SE", indicatif: "+46", flag: "🇸🇪", localLength: 9, region: "Europe" },
  //   { name: "Norvège", code: "NO", indicatif: "+47", flag: "🇳🇴", localLength: 8, region: "Europe" },
  //   { name: "Danemark", code: "DK", indicatif: "+45", flag: "🇩🇰", localLength: 8, region: "Europe" },
  //   { name: "Finlande", code: "FI", indicatif: "+358", flag: "🇫🇮", localLength: 9, region: "Europe" },
  //   { name: "Portugal", code: "PT", indicatif: "+351", flag: "🇵🇹", localLength: 9, region: "Europe" },
  //   { name: "Grèce", code: "GR", indicatif: "+30", flag: "🇬🇷", localLength: 10, region: "Europe" },
  //   { name: "Irlande", code: "IE", indicatif: "+353", flag: "🇮🇪", localLength: 9, region: "Europe" },
  //   { name: "Pologne", code: "PL", indicatif: "+48", flag: "🇵🇱", localLength: 9, region: "Europe" },
  //   { name: "République tchèque", code: "CZ", indicatif: "+420", flag: "🇨🇿", localLength: 9, region: "Europe" },
  //   { name: "Hongrie", code: "HU", indicatif: "+36", flag: "🇭🇺", localLength: 9, region: "Europe" },
  //   { name: "Roumanie", code: "RO", indicatif: "+40", flag: "🇷🇴", localLength: 10, region: "Europe" },

  //   // Amériques
  //   { name: "États-Unis", code: "US", indicatif: "+1", flag: "🇺🇸", localLength: 10, region: "Amériques" },
  //   { name: "Canada", code: "CA", indicatif: "+1", flag: "🇨🇦", localLength: 10, region: "Amériques" },
  //   { name: "Brésil", code: "BR", indicatif: "+55", flag: "🇧🇷", localLength: 11, region: "Amériques" },
  //   { name: "Mexique", code: "MX", indicatif: "+52", flag: "🇲🇽", localLength: 10, region: "Amériques" },
  //   { name: "Argentine", code: "AR", indicatif: "+54", flag: "🇦🇷", localLength: 10, region: "Amériques" },
  //   { name: "Colombie", code: "CO", indicatif: "+57", flag: "🇨🇴", localLength: 10, region: "Amériques" },
  //   { name: "Pérou", code: "PE", indicatif: "+51", flag: "🇵🇪", localLength: 9, region: "Amériques" },
  //   { name: "Venezuela", code: "VE", indicatif: "+58", flag: "🇻🇪", localLength: 10, region: "Amériques" },
  //   { name: "Chili", code: "CL", indicatif: "+56", flag: "🇨🇱", localLength: 9, region: "Amériques" },
  //   { name: "Équateur", code: "EC", indicatif: "+593", flag: "🇪🇨", localLength: 9, region: "Amériques" },

  //   // Asie
  //   { name: "Chine", code: "CN", indicatif: "+86", flag: "🇨🇳", localLength: 11, region: "Asie" },
  //   { name: "Japon", code: "JP", indicatif: "+81", flag: "🇯🇵", localLength: 10, region: "Asie" },
  //   { name: "Corée du Sud", code: "KR", indicatif: "+82", flag: "🇰🇷", localLength: 10, region: "Asie" },
  //   { name: "Inde", code: "IN", indicatif: "+91", flag: "🇮🇳", localLength: 10, region: "Asie" },
  //   { name: "Indonésie", code: "ID", indicatif: "+62", flag: "🇮🇩", localLength: 10, region: "Asie" },
  //   { name: "Thaïlande", code: "TH", indicatif: "+66", flag: "🇹🇭", localLength: 9, region: "Asie" },
  //   { name: "Vietnam", code: "VN", indicatif: "+84", flag: "🇻🇳", localLength: 9, region: "Asie" },
  //   { name: "Philippines", code: "PH", indicatif: "+63", flag: "🇵🇭", localLength: 10, region: "Asie" },
  //   { name: "Malaisie", code: "MY", indicatif: "+60", flag: "🇲🇾", localLength: 9, region: "Asie" },
  //   { name: "Singapour", code: "SG", indicatif: "+65", flag: "🇸🇬", localLength: 8, region: "Asie" },
];

export const getCountryByIndicatif = (
  indicatif: string,
): Country | undefined => {
  return COUNTRIES.find((country) => country.indicatif === indicatif);
};

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find((country) => country.code === code);
};
