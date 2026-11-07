// ==========================================
// База споріднених та схожих виконавців за стилем, жанром та звучанням
// ==========================================

export const SIMILAR_ARTISTS_MAP: Record<string, string[]> = {
  // Rock, Alternative & Metal
  'skillet': ['Three Days Grace', 'Breaking Benjamin', 'Linkin Park', 'Thousand Foot Krutch', 'Papa Roach', 'Starset', 'Evanescence'],
  'three days grace': ['Skillet', 'Breaking Benjamin', 'Linkin Park', 'Papa Roach', 'Saint Asonia', 'Theory of a Deadman', 'Seether'],
  'breaking benjamin': ['Three Days Grace', 'Skillet', 'Chevelle', 'Seether', 'Shinedown', 'Red', 'Starset'],
  'linkin park': ['Three Days Grace', 'Skillet', 'Papa Roach', 'Limp Bizkit', 'Evanescence', 'System of a Down', 'Bring Me The Horizon'],
  'evanescence': ['Within Temptation', 'Linkin Park', 'Nightwish', 'Halestorm', 'Flyleaf', 'Lacuna Coil', 'Skillet'],
  'papa roach': ['Three Days Grace', 'Skillet', 'Linkin Park', 'Drowning Pool', 'P.O.D.', 'Saliva', 'Limp Bizkit'],
  'starset': ['Skillet', 'Breaking Benjamin', 'Red', 'I Prevail', 'From Ashes to New', 'Thousand Foot Krutch'],
  'rammstein': ['System of a Down', 'Slipknot', 'Marilyn Manson', 'Korn', 'Disturbed', 'Megaherz', 'OOMPH!'],
  'system of a down': ['Rammstein', 'Slipknot', 'Korn', 'Deftones', 'Serj Tankian', 'Limp Bizkit', 'Disturbed'],
  'slipknot': ['Korn', 'System of a Down', 'Stone Sour', 'Disturbed', 'Marilyn Manson', 'Mudvayne'],
  'korn': ['Slipknot', 'Limp Bizkit', 'Deftones', 'System of a Down', 'Disturbed', 'Linkin Park'],
  'limp bizkit': ['Linkin Park', 'Korn', 'Papa Roach', 'P.O.D.', 'Crazy Town', 'Rage Against the Machine'],
  'bring me the horizon': ['Falling In Reverse', 'Bad Omens', 'Architects', 'I Prevail', 'Pierce The Veil', 'A Day To Remember'],
  'falling in reverse': ['Bring Me The Horizon', 'Escape the Fate', 'Bad Omens', 'Ice Nine Kills', 'Motionless In White'],
  'bad omens': ['Bring Me The Horizon', 'Sleep Token', 'Falling In Reverse', 'I Prevail', 'Architects'],
  'måneskin': ['Arctic Monkeys', 'The Neighbourhood', 'YUNGBLUD', 'The Black Keys', 'Royal Blood', 'Franz Ferdinand'],
  'arctic monkeys': ['The Strokes', 'The Neighbourhood', 'The Black Keys', 'Franz Ferdinand', 'Foals', 'Kasabian'],
  'the neighbourhood': ['Arctic Monkeys', 'Chase Atlantic', 'Lana Del Rey', 'Cigarettes After Sex', 'BØRNS', 'Two Feet'],
  'chase atlantic': ['The Neighbourhood', 'The Weeknd', 'Blackbear', 'Jxdn', 'YUNGBLUD'],
  'imagine dragons': ['OneRepublic', 'Coldplay', 'Fall Out Boy', 'Bastille', 'Twenty One Pilots', 'The Script', 'X Ambassadors'],
  'coldplay': ['Imagine Dragons', 'OneRepublic', 'The Script', 'Keane', 'Snow Patrol', 'U2', 'The Fray'],
  'onerepublic': ['Imagine Dragons', 'Coldplay', 'The Script', 'Maroon 5', 'Shawn Mendes', 'American Authors'],
  'twenty one pilots': ['Imagine Dragons', 'Fall Out Boy', 'Panic! At The Disco', 'My Chemical Romance', 'AJR', 'Walk the Moon'],
  'fall out boy': ['Panic! At The Disco', 'My Chemical Romance', 'All Time Low', 'Paramore', 'Green Day', 'Twenty One Pilots'],
  'panic! at the disco': ['Fall Out Boy', 'My Chemical Romance', 'Paramore', 'Twenty One Pilots', 'The All-American Rejects'],
  'my chemical romance': ['Fall Out Boy', 'Panic! At The Disco', 'The Used', 'Green Day', 'Paramore', 'Pierce The Veil'],
  'paramore': ['Fall Out Boy', 'My Chemical Romance', 'Avril Lavigne', 'Tonight Alive', 'Flyleaf', 'Against The Current'],
  'nirvana': ['Foo Fighters', 'Alice In Chains', 'Pearl Jam', 'Soundgarden', 'The Smashing Pumpkins', 'Green Day', 'Bush'],
  'foo fighters': ['Nirvana', 'Red Hot Chili Peppers', 'Pearl Jam', 'Audioslave', 'Weezer', 'Queens of the Stone Age'],
  'green day': ['Blink-182', 'The Offspring', 'Sum 41', 'Simple Plan', 'Good Charlotte', 'Rise Against', 'Jimmy Eat World'],
  'blink-182': ['Green Day', 'Sum 41', 'The Offspring', 'Simple Plan', 'Angels & Airwaves', 'Box Car Racer'],
  'queen': ['David Bowie', 'The Beatles', 'Elton John', 'Led Zeppelin', 'AC/DC', 'Aerosmith', 'Freddie Mercury'],
  'ac/dc': ['Guns N\' Roses', 'Led Zeppelin', 'Metallica', 'Black Sabbath', 'Iron Maiden', 'Scorpions', 'Deep Purple'],
  'metallica': ['Megadeth', 'Iron Maiden', 'Judas Priest', 'Slayer', 'Pantera', 'Anthrax', 'Black Sabbath'],

  // Ukrainian Rock, Punk & Indie
  'діти інженерів': ['хейтспіч', 'структура щастя', 'Schmalgauzen', 'thekomakoma', 'Жадан і Собаки', 'Latexfauna', 'ДК Енергетик'],
  'хейтспіч': ['діти інженерів', 'структура щастя', 'Жадан і Собаки', 'Mistmorn', 'Мюслі UA', 'Паліндром', 'Schmalgauzen'],
  'структура щастя': ['діти інженерів', 'хейтспіч', 'SadSvit', 'Mistmorn', 'thekomakoma', 'Schmalgauzen'],
  'sadsvit': ['структура щастя', 'Mistmorn', 'хейтспіч', 'Паліндром', 'Schmalgauzen', 'thekomakoma', 'Molchat Doma'],
  'schmalgauzen': ['діти інженерів', 'структура щастя', 'Latexfauna', 'SadSvit', 'хейтспіч', 'thekomakoma'],
  'thekomakoma': ['діти інженерів', 'Latexfauna', 'Schmalgauzen', 'структура щастя', 'Курган & Agregat'],
  'океан ельзи': ['Бумбокс', 'Скрябін', 'Антитіла', 'Друга Ріка', 'Без Обмежень', 'Один в каное', 'СКАЙ'],
  'бумбокс': ['Океан Ельзи', 'Скрябін', 'Антитіла', 'Pianoбой', 'KAZKA', 'Latexfauna', 'Друга Ріка'],
  'скрябін': ['Океан Ельзи', 'Бумбокс', 'Антитіла', 'ТНМК', 'Друга Ріка', 'Мотор\'ролла', 'Кузьма Скрябін'],
  'антитіла': ['Океан Ельзи', 'Бумбокс', 'Без Обмежень', 'Скрябін', 'Друга Ріка', 'KAZKA', 'СКАЙ'],
  'без обмежень': ['Антитіла', 'Океан Ельзи', 'Бумбокс', 'Друга Ріка', 'СКАЙ', 'Pianoбой'],
  'один в каное': ['Vivienne Mort', 'Христина Соловій', 'KAZKA', 'Latexfauna', 'ДахаБраха', 'zapaska'],
  'latexfauna': ['Один в каное', 'Бумбокс', 'Курган & Agregat', 'Schmalgauzen', 'thekomakoma', 'Zbaraski'],
  'жадан і собаки': ['діти інженерів', 'хейтспіч', 'Брати Гадюкіни', 'Тартак', 'Karna', 'Гайдамаки'],
  'karna': ['Жадан і Собаки', 'АННА', 'Тінь Сонця', 'Чумацький Шлях', 'Козак Систем', 'Мотор\'ролла'],
  'тінь сонця': ['Karna', 'Козак Систем', 'Гайдамаки', 'Мандри', 'Веремій'],

  // Ukrainian Pop & Modern Scene
  'klavdia petrivna': ['Jerry Heil', 'alyona alyona', 'DOROFEEVA', 'KOLA', 'ROXOLANA', 'YAKTAK', 'Ostrovskyi'],
  'dorofeeva': ['KOLA', 'Jerry Heil', 'Klavdia Petrivna', 'YAKTAK', 'NK', 'Positiff', 'ROXOLANA'],
  'kola': ['DOROFEEVA', 'Jerry Heil', 'Klavdia Petrivna', 'YAKTAK', 'MamaRika', 'SHUMEI'],
  'jerry heil': ['alyona alyona', 'Klavdia Petrivna', 'KOLA', 'DOROFEEVA', 'ROXOLANA', 'Kalush'],
  'yaktak': ['KOLA', 'DOROFEEVA', 'SHUMEI', 'Parfeniuk', 'ENLEO', 'Golubenko', 'SKYLERR'],
  'parfeniuk': ['YAKTAK', 'Golubenko', 'SHUMEI', 'ENLEO', 'DOROFEEVA', 'SKYLERR'],
  'shumei': ['YAKTAK', 'KOLA', 'Zlata Ognevich', 'Parfeniuk', 'ENLEO', 'MamaRika'],
  'skylerr': ['YAKTAK', 'DOROFEEVA', 'KOLA', 'Parfeniuk', 'ROXOLANA', 'Golubenko'],
  'artem pivovarov': ['DOROFEEVA', 'KOLA', 'NK', 'KAZKA', 'MONATIK', 'Злата Огнєвіч'],
  'monatik': ['Artem Pivovarov', 'DOROFEEVA', 'KAZKA', 'NK', 'Max Barskih'],
  'max barskih': ['MONATIK', 'Artem Pivovarov', 'DOROFEEVA', 'Alekseev', 'NK'],
  'kazka': ['Один в каное', 'Бумбокс', 'Go_A', 'Jerry Heil', 'KOLA'],
  'go_a': ['ДахаБраха', 'Kalush Orchestra', 'KAZKA', 'Onuka', 'Alina Pash'],

  // Pop, R&B & Soul
  'lady gaga': ['Katy Perry', 'Ariana Grande', 'Dua Lipa', 'Britney Spears', 'Madonna', 'Rihanna', 'Beyoncé'],
  'bruno mars': ['The Weeknd', 'Silk Sonic', 'Michael Jackson', 'Justin Timberlake', 'Ed Sheeran', 'Post Malone'],
  'taylor swift': ['Olivia Rodrigo', 'Sabrina Carpenter', 'Billie Eilish', 'Selena Gomez', 'Lana Del Rey', 'Gracie Abrams'],
  'sabrina carpenter': ['Olivia Rodrigo', 'Taylor Swift', 'Dua Lipa', 'Tate McRae', 'Camila Cabello', 'Ariana Grande'],
  'olivia rodrigo': ['Sabrina Carpenter', 'Taylor Swift', 'Billie Eilish', 'Conan Gray', 'Tate McRae', 'Gracie Abrams'],
  'billie eilish': ['Lana Del Rey', 'Finneas', 'Olivia Rodrigo', 'Lorde', 'Melanie Martinez', 'Girl In Red'],
  'the weeknd': ['Post Malone', 'Drake', 'Bruno Mars', 'Travis Scott', 'Frank Ocean', 'Kendrick Lamar', 'Chase Atlantic'],
  'dua lipa': ['Katy Perry', 'Ariana Grande', 'Lady Gaga', 'Doja Cat', 'Bebe Rexha', 'Ava Max', 'Sabrina Carpenter'],
  'ariana grande': ['Dua Lipa', 'Katy Perry', 'Selena Gomez', 'Camila Cabello', 'Doja Cat', 'Billie Eilish'],
  'lana del rey': ['Billie Eilish', 'The Neighbourhood', 'Lorde', 'Cigarettes After Sex', 'Marina', 'Mitski'],
  'adele': ['Sam Smith', 'Sia', 'Lewis Capaldi', 'Amy Winehouse', 'Lady Gaga', 'Ed Sheeran'],
  'ed sheeran': ['Shawn Mendes', 'James Arthur', 'Lewis Capaldi', 'Sam Smith', 'Charlie Puth'],

  // Hip-Hop, Rap & Trap
  'eminem': ['50 Cent', 'Dr. Dre', 'Snoop Dogg', '2Pac', 'Kendrick Lamar', 'NF', 'Logic', 'B-Real'],
  'kendrick lamar': ['Drake', 'J. Cole', 'Travis Scott', 'Kanye West', 'Baby Keem', 'Eminem', 'A$AP Rocky'],
  'travis scott': ['Don Toliver', 'Future', 'Metro Boomin', 'Playboi Carti', 'Lil Uzi Vert', '21 Savage', 'Drake'],
  'drake': ['Travis Scott', 'Future', 'The Weeknd', '21 Savage', 'Post Malone', 'Kendrick Lamar', 'Lil Wayne'],
  'post malone': ['The Weeknd', 'Swae Lee', 'Juice WRLD', 'Khalid', '21 Savage', 'Drake', 'Lil Peep'],
  'juice wrld': ['XXXTENTACION', 'Lil Peep', 'Trippie Redd', 'Post Malone', 'Polo G', 'The Kid LAROI'],
  'xxxtentacion': ['Juice WRLD', 'Lil Peep', 'Trippie Redd', 'Ski Mask The Slump God', 'Lil Uzi Vert'],

  // Electronic, Witch House, Phonk & Synthwave
  'pastel ghost': ['Crystal Castles', 'Mareux', 'Crim3s', 'Sidewalks and Skeletons', 'Mr.Kitty', 'Snow Strippers', 'Boy Harsher'],
  'crystal castles': ['Pastel Ghost', 'Crim3s', 'Mareux', 'Sidewalks and Skeletons', 'SALEM', 'Grimes', 'Alice Glass'],
  'mareux': ['Pastel Ghost', 'Boy Harsher', 'Molchat Doma', 'Lebanon Hanover', 'Crystal Castles', 'She Past Away'],
  'kordhell': ['DVRST', 'Hensonn', 'Pharmacist', 'INTERWORLD', 'PLAYAMANE', 'SXMPRA', 'MUPP'],
  'dvrst': ['Kordhell', 'Hensonn', 'INTERWORLD', 'Pharmacist', 'PlayaPhonk', 'g3ox_em'],

  // Geek & Gaming Culture
  'smg4': ['The Living Tombstone', 'CG5', 'DAGames', 'Stupendium', 'JT Music', 'NateWantsToBattle'],
  'the living tombstone': ['CG5', 'DAGames', 'Stupendium', 'JT Music', 'Smg4', 'NateWantsToBattle', 'TryHardNinja']
};

/**
 * Отримати список схожих артистів за ім'ям виконавця
 */
export function getSimilarArtists(artistName: string): string[] {
  if (!artistName) return [];
  const norm = artistName.toLowerCase().trim();

  // Прямий пошук у базі
  if (SIMILAR_ARTISTS_MAP[norm]) {
    return SIMILAR_ARTISTS_MAP[norm];
  }

  // Пошук за частковим співпадінням
  for (const [key, val] of Object.entries(SIMILAR_ARTISTS_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }

  return [];
}

