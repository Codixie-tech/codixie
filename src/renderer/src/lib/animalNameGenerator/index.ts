import animalsData from "./animals.json";
import adjectivesData from "./adjectives.json";

const animals: Record<string, string[]> = animalsData.reduce((result: Record<string, string[]>, word: string) => {
  const firstLetter = word.charAt(0);
  if (!(firstLetter in result)) {
    result[firstLetter] = [];
  }
  result[firstLetter].push(word);
  return result;
}, {});

const adjectives: Record<string, string[]> = adjectivesData.reduce((result: Record<string, string[]>, word: string) => {
  const firstLetter = word.charAt(0);
  if (!(firstLetter in result)) {
    result[firstLetter] = [];
  }
  result[firstLetter].push(word);
  return result;
}, {});

const possibleLetters = Object.keys(adjectives).filter((letter) => Object.keys(animals).includes(letter));

function pickRandomly(wordCollection: string[]): string {
  return wordCollection[Math.floor(Math.random() * wordCollection.length)];
}

function generateRandomAnimalName(): string {
  const letter = pickRandomly(possibleLetters);
  const adjective = pickRandomly(adjectives[letter]);
  const animal = pickRandomly(animals[letter]).split(" ").join("-");
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(adjective)} ${capitalize(animal)}`;
}

export default generateRandomAnimalName;
