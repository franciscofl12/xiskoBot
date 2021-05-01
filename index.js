const { Client, User, MessageEmbed } = require('discord.js');
const client = new Client();
const db = require('megadb');
const database = new db.crearDB({ nombre: 'config', carpeta: 'database' });
client.prefix = '!';

function presence(){
  client.user.setPresence({
     status: "online",
     activity: {
        name: "MuciaCity. Creado por Xisko",
        type: "PLAYING"
     }
  });
}

client.on('ready', () => {
  console.log('bot online ');
  presence();
});
client.login('Nzk2Mzk4MTY1MDMzMDkxMDcy.X_XVlg.qVEM9UFIDqf9fkQ2rcGSJXC2nSU'); 

client.on('message', async message => {
  if (message.author.bot) return;
  if (message.content.startsWith(client.prefix)) {
    const [cmdName, ...cmdArgs] = message.content.slice(client.prefix.length).trim().split(/\s+/);

    if (['setup', 'sancion', 'suspenso', 'aprobado'].includes(cmdName)) {
      message.delete({ timeout: 100 });
    }

    if (cmdName == 'setup') {
      if (!message.member.permissions.has('ADMINISTRATOR')) return;
      if (!database.has(message.guild.id)) {
        await database.set(message.guild.id, {
          channel: false,
          staff: false,
          sancionChannel: false,
          roles: {
            aprobado: false,
            suspenso: false,
            suspenso2: false,
          },
        });
      }

      if (cmdArgs[0] == 'channel') {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(cmdName[1]);
        if (!channel) return message.channel.send('Indica un canal valido, el canal mencionado no existe');
        if (channel) {
          await database.set(`${message.guild.id}.channel`, channel.id);
          return message.channel.send('Se ha guardado correctamente el canal en la base de datos.').then(e => e.delete({ timeout: 4000 }));
        }
      } else if (cmdArgs[0] == 'staff') {
        let roles = message.mentions.roles.first() || message.guild.roles.cache.get(cmdArgs[1]);
        if (!roles) return message.channel.send('Menciona o indica la ID valida').then(e => e.delete({ timeout: 4000 }));
        if (roles) {
          await database.set(`${message.guild.id}.staff`, roles.id);
          return message.channel.send('Se ha guardado correctamente el rol de staff');
        }
      } else if (cmdArgs[0] == 'roles') {
        if (!['suspenso1', 'suspenso2', 'aprobado'].includes(cmdArgs[1])) return message.channel.send('Opcion invalida');
        if (cmdArgs[1] == 'suspenso1') {
          let role = message.mentions.roles.first();
          if (!role) return message.channel.send('Indica un rol valido');
          if (role) {
            await database.set(`${message.guild.id}.roles.suspenso`, role.id);
          }
        } else if (cmdArgs[1] == 'suspenso2') {
          let role = message.mentions.roles.first();
          if (!role) return message.channel.send('Indica un rol valido');
          if (role) {
            await database.set(`${message.guild.id}.roles.suspenso2`, role.id);
          }
        } else if (cmdArgs[1] == 'aprobado') {
          let role = message.mentions.roles.first();
          if (!role) return message.channel.send('Indica un rol valido');
          if (role) {
            await database.set(`${message.guild.id}.roles.aprobado`, role.id);
          }
        }
        return message.channel.send('Se ha guardado la informacion correctamente');
      } else if (cmdArgs[0] == 'sancion') {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(cmdName[1]);
        if (!channel) return message.channel.send('Indica un canal valido, el canal mencionado no existe');
        if (channel) {
          await database.set(`${message.guild.id}.sancionChannel`, channel.id);
          return message.channel.send('Se ha guardado correctamente el canal en la base de datos.').then(e => e.delete({ timeout: 4000 }));
        }
      }
    }

    if (cmdName == 'suspenso') {
      let roleStaff = await database.get(`${message.guild.id}.staff`);
      if (!message.member.roles.cache.has(roleStaff)) return console.log('no tiene staff');
      let channel = message.guild.channels.cache.get(await database.get(`${message.guild.id}.channel`));
      if (message.channel.id != channel.id) return;
      let user = message.mentions.members.first();
      if (!user) return;
      let roles = [await database.get(`${message.guild.id}.roles.suspenso`), await database.get(`${message.guild.id}.roles.suspenso2`)];
      if (user.roles.cache.has(roles[0])) {
        user.roles.add(roles[1]);
        return message.channel.send(` ${user} Tu examen de whitelist queda suspenso.   :x:   Ultimo intento no superado.  Suspendido por ${message.author.username}  `);
      }
      user.roles.add(roles[0]);
      message.channel.send(
        `${user} Tu examen de whitelist queda suspenso.   :x:   ¡Inténtalo de nuevo en 24 horas, suerte! Suspendido por ${message.author.username}    `,
      );
    } else if (cmdName == 'aprobado') {
      let roleStaff = await database.get(`${message.guild.id}.staff`);
      if (!message.member.roles.cache.has(roleStaff)) return console.log('no tiene staff');

      let channel = message.guild.channels.cache.get(await database.get(`${message.guild.id}.channel`));
      if (message.channel.id != channel.id) return;
      let user = message.mentions.members.first();
      if (!user) return;
      let role = [await database.get(`${message.guild.id}.roles.aprobado`)];
      let rolesRemove = [await database.get(`${message.guild.id}.roles.suspenso`), await database.get(`${message.guild.id}.roles.suspenso2`)];
      await user.roles.remove(rolesRemove);
      await user.roles.add(role);
      message.channel.send(`${user} Enhorabuena, tu examen de Whitelist ha sido aprobado   :white_check_mark:  ¡Disfruta del servidor! Aprobado por ${message.author.username}     `);
    } else if (cmdName == 'sancion') {
      let roleStaff = await database.get(`${message.guild.id}.staff`);
      if (!message.member.roles.cache.has(roleStaff)) return console.log('no tiene staff');

      let user = message.mentions.members.first();
      const validTime = /^\d+(s|m|h|d)$/;
      const validNumber = /\d+/;
      let reason = cmdArgs.slice(2).join(' ');
      if (!user) return;
      if (!validTime.test(cmdArgs[1]))
        return message.channel.send('Tiempo invalido, asegurate de ingresar un tiempo valido').then(e => e.delete({ timeout: 10000 }));
      if (!validNumber.test(cmdArgs[1]))
        return message.channel.send('Tiempo invalido, asegurate de ingresar un tiempo valido').then(e => e.delete({ timeout: 10000 }));

      let channel = message.guild.channels.cache.get(await database.get(`${message.guild.id}.sancionChannel`));
      await channel.send(
        new MessageEmbed()
          .setTitle("MurciaCity Sanciones")
          .addField('Usuario: ', user.user.username)
          .addField('Staff: ', `${message.author.username}`)
          .addField('Razon: ', `${reason}`)
          .addField('Tiempo:', `${cmdArgs[1]}`)
          .setColor(15105570)
		      .setFooter("© MurciaCity", "https://i.imgur.com/fcMxKTn.png"),
      );
    }
  }
});
