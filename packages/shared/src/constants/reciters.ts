/** Reciter style categories */
export type ReciterStyleTag = "Murattal" | "Mujawwad" | "Muallim";

/** Curated reciter entry (uses QDC audio API IDs) */
export interface CuratedReciter {
  id: number;
  name: string;
  country: string;
  style: ReciterStyleTag;
  featured: boolean;
}

/**
 * Curated reciter list — local constant, no API dependency.
 * IDs match api.qurancdn.com chapter audio endpoint.
 * Names verified against audio URL paths + API responses.
 */
export const CURATED_RECITERS: CuratedReciter[] = [
  // Featured
  { id: 129, name: "Mahmood Ali Al-Banna", country: "Mısır", style: "Murattal", featured: true },
  { id: 6, name: "Mahmoud Khalil Al-Husary", country: "Mısır", style: "Murattal", featured: true },
  { id: 12, name: "Mahmoud Khalil Al-Husary", country: "Mısır", style: "Muallim", featured: true },
  { id: 7, name: "Mishari Rashid al-Afasy", country: "Kuveyt", style: "Murattal", featured: true },

  // Others (alphabetical by name)
  { id: 1, name: "AbdulBaset AbdulSamad", country: "Mısır", style: "Mujawwad", featured: false },
  { id: 2, name: "AbdulBaset AbdulSamad", country: "Mısır", style: "Murattal", featured: false },
  { id: 124, name: "Abdullah Matroud", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 3, name: "Abdur-Rahman as-Sudais", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 4, name: "Abu Bakr al-Shatri", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 113, name: "Ahmad Al-Huthayfi", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 117, name: "Bandar Baleela", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 14, name: "Fares Abbad", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 5, name: "Hani ar-Rifai", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 116, name: "Idrees Akbar", country: "Hindistan", style: "Murattal", featured: false },
  { id: 93, name: "Imad Zuhair Hafez", country: "Suriye", style: "Murattal", featured: false },
  { id: 103, name: "Ibrahim Al-Akhdar", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 161, name: "Khalifah Al Tunaiji", country: "BAE", style: "Murattal", featured: false },
  { id: 122, name: "Mahmoud Khalil Al-Husary", country: "Mısır", style: "Mujawwad", featured: false },
  { id: 52, name: "Maher Al-Muaiqly", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 91, name: "Mohammad Al-Tablawi", country: "Mısır", style: "Murattal", featured: false },
  { id: 9, name: "Mohamed Siddiq al-Minshawi", country: "Mısır", style: "Murattal", featured: false },
  { id: 88, name: "Mostafa Ismaeel", country: "Mısır", style: "Murattal", featured: false },
  { id: 22, name: "Muhammad Ayyoub", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 119, name: "Muhammad Khaleel", country: "Mısır", style: "Murattal", featured: false },
  { id: 104, name: "Nasser Al-Qatami", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 10, name: "Sa'ud ash-Shuraim", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 13, name: "Saad Al-Ghamdi", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 43, name: "Salah Al-Budair", country: "Suudi Arabistan", style: "Murattal", featured: false },
  { id: 97, name: "Yasser Ad-Dossari", country: "Suudi Arabistan", style: "Murattal", featured: false },
];

/** Featured reciters only */
export const FEATURED_RECITERS = CURATED_RECITERS.filter((r) => r.featured);
