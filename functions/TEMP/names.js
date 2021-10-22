const phonetic = require('phonetic');

const num = 50;
for (let i = 0; i < num; i++) {
  const syllables = Math.floor(Math.random() * 3) + 1;
  const name = phonetic.generate({ syllables });
  console.log(name);
}
