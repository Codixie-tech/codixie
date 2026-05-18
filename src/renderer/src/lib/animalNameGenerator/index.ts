/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-nocheck

import animalsData from "./animals.json";
import adjectivesData from "./adjectives.json";

function groupByFirstLetter(wordCollection) {
  return wordCollection.reduce((result, word) => {
    const firstLetter = word.charAt(0);
    if (!(firstLetter in result)) {
      result[firstLetter] = [];
    }
    result[firstLetter].push(word);
    return result;
  }, {});
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function pickRandomly(wordCollection) {
  return wordCollection[Math.floor(Math.random() * wordCollection.length)];
}

function findCommonLetters(lettersA, lettersB) {
  return lettersA.reduce((result, letter) => {
    if (lettersB.indexOf(letter) > -1) {
      result.push(letter);
    }
    return result;
  }, []);
}

const animals = groupByFirstLetter(animalsData);
const adjectives = groupByFirstLetter(adjectivesData);

const possibleLetters = findCommonLetters(
  Object.keys(adjectives),
  Object.keys(animals),
);

function findRandomAdjective(letter) {
  return pickRandomly(adjectives[letter]);
}

function findRandomAnimalName(letter) {
  return pickRandomly(animals[letter]).split(" ").join("-");
}

function generateRandomAnimalName() {
  const letter = pickRandomly(possibleLetters);
  const adjective = findRandomAdjective(letter);
  const animal = findRandomAnimalName(letter);
  return `${capitalizeFirstLetter(adjective)} ${capitalizeFirstLetter(animal)}`;
}

export default generateRandomAnimalName;
