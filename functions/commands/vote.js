module.exports = {
  name: 'vote',
  usage: 'vote <phrase>',
  hide: true,
  aliases: [],
  description: 'Try a vote.',
  execute: async function (message, options, userParams, yargParams) {
    const tag = 'SomeUser'
    const newMessage = await message.channel.send(`Does ${tag} look like a Human?`);
    const yes = '👍';
    const no = '👎';
    newMessage.react(yes);
    newMessage.react(no);

    const votedById = {};
    let yesVotes = 0;
    let noVotes = 0;

    const filter = (reaction, user) => {
      if (user.id === newMessage.author.id) return false;
      if (votedById[user.id]) return false;

      const { name } = reaction.emoji;
      return [yes, no].includes(name);
    };

    const collector = newMessage.createReactionCollector(filter, { time: 5000, dispose: true });

    collector.on('collect', (reaction, user) => {
      console.log(`Collected ${reaction.emoji.name} from ${user.tag}.`);
      votedById[user.id] = reaction.emoji.name;
      if (reaction.emoji.name === yes) yesVotes ++;
      if (reaction.emoji.name === no) noVotes ++;
    });

    collector.on('remove', (reaction, user) => {
      console.log(`Removed ${reaction.emoji.name} from ${user.tag}.`)
      delete votedById[user.id];
      if (reaction.emoji.name === yes) yesVotes --;
      if (reaction.emoji.name === no) noVotes --;
    })

    collector.on('end', collected => {
      console.log(yesVotes, noVotes);
    });

    const role = message.guild.roles.cache.find(role => role.name === "Citizen");
    message.member.roles.add(role)
      .then(message.channel.send("Role added!"))
      .catch(console.log);
    console.log('role', role);
  }
}
