require('./settings')
const { modul } = require('./module');
const moment = require('moment-timezone');
const { baileys, boom, chalk, fs, FileType, path, pino, process, PhoneNumber, axios, yargs, _ } = modul;
const { Boom } = boom
const {
	default: XeonBotIncConnect,
	BufferJSON,
	processedMessages,
	PHONENUMBER_MCC,
	initInMemoryKeyStore,
	DisconnectReason,
	AnyMessageContent,
        makeInMemoryStore,
	useMultiFileAuthState,
	delay,
	fetchLatestBaileysVersion,
	generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    makeCacheableSignalKeyStore,
    getAggregateVotesInPollMessage,
    proto
} = require("@whiskeysockets/baileys")
const { color, bgcolor } = require('./lib/color')
const { TelegraPh } = require('./lib/uploader')
const NodeCache = require("node-cache")
const canvafy = require("canvafy")
const { parsePhoneNumber } = require("libphonenumber-js")
let _welcome = JSON.parse(fs.readFileSync('./database/welcome.json'))
let _left = JSON.parse(fs.readFileSync('./database/left.json'))
const makeWASocket = require("@whiskeysockets/baileys").default
const Pino = require("pino")
const readline = require("readline")
const colors = require('colors')
const { start } = require('./lib/spinner')
const { uncache, nocache } = require('./lib/loader')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep, reSize } = require('./lib/myfunc')

const prefix = ''
let phoneNumber = "916909137213"
global.db = JSON.parse(fs.readFileSync('./database/database.json'))
if (global.db) global.db = {
sticker: {},
database: {}, 
groups: {}, 
game: {},
others: {},
users: {},
chats: {},
settings: {},
...(global.db || {})
}
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")

const useMobile = process.argv.includes("--mobile")
const owner = JSON.parse(fs.readFileSync('./database/owner.json'))

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const question = (text) => new Promise((resolve) => {
	process.stdout.write('\n')
	rl.question(text, resolve)
})
const logTime = () => moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')
const jidDisplayName = (jid = '') => {
	const clean = String(jid || '').replace(/@.+$/, '')
	if (!clean || String(jid).endsWith('@lid')) return clean || 'Unknown'
	try {
		return PhoneNumber('+' + clean).getNumber('international')
	} catch {
		return clean
	}
}
const line = chalk.gray('─'.repeat(36))
const logBox = (title, rows = [], accent = 'cyan') => {
	console.log(line)
	console.log(chalk[accent].bold(` ${title}`))
	for (const row of rows) console.log(`${chalk.gray(' >')} ${row}`)
	console.log(line)
}
const logInfo = (label, message, accent = 'cyan') => {
	console.log(`${chalk.gray(`[${logTime()}]`)} ${chalk[accent].bold(label)} ${message}`)
}
const showStartup = () => {
	logBox('BOT STARTUP', [
		`${chalk.white('Bot   :')} ${chalk.cyan(global.botname)}`,
		`${chalk.white('Owner :')} ${chalk.cyan(global.ownername)}`,
		`${chalk.white('Mode  :')} ${pairingCode ? chalk.green('Pairing') : chalk.yellow('QR')}`,
		`${chalk.white('Sess  :')} ${chalk.cyan(global.sessionName)}`,
		`${chalk.white('Time  :')} ${chalk.cyan(logTime())}`,
	], 'cyan')
}
require('./Nano.js')
nocache('../Nano.js', module => logInfo('HOT-RELOAD', `${module} updated`, 'green'))
require('./index.js')
nocache('../index.js', module => logInfo('HOT-RELOAD', `${module} updated`, 'green'))
async function NanoBotzInd() {
	showStartup()
	const {  saveCreds, state } = await useMultiFileAuthState(`./${sessionName}`)
	const msgRetryCounterCache = new NodeCache()
    	const NanoBotz = XeonBotIncConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
      mobile: useMobile,
     auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      browser: [ 'Mac OS', 'Safari', '10.15.7' ],
      patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
      auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }).child({ level: "fatal" })),
      },
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
emitOwnEvents: true,
fireInitQueries: true,
generateHighQualityLinkPreview: true,
syncFullHistory: true,
markOnlineOnConnect: true,
      getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg.message || undefined
            }
            return {
                conversation: "Cheems Bot Here!"
            }
        },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: undefined,
   })
const RATE_LIMIT_PATTERNS = [
/rate[-_\s]?overlimit/i,
/rate[-_\s]?limit/i,
/too many requests/i,
/\b429\b/,
/overlimit/i
]
const MIN_SEND_INTERVAL_MS = 350
const MAX_RATE_RETRY = 4
let sendQueue = Promise.resolve()
let lastSendAt = 0
const groupMetadataCache = new NodeCache({ stdTTL: 120, checkperiod: 60, useClones: false })
const groupMetadataInflight = new Map()
const isRateOverlimitError = (err) => {
if (!err) return false
const message = [
err?.message,
err?.data,
err?.response?.data?.message,
err?.response?.data?.error,
err?.output?.payload?.message,
err?.output?.payload?.error,
err?.stack
].filter(Boolean).join(' | ')
const statusCode = err?.response?.status || err?.output?.statusCode || err?.data?.status
return RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(message)) || Number(statusCode) === 429
}
const queueOutbound = async (task) => {
const run = async () => {
const waitForGap = Math.max(0, MIN_SEND_INTERVAL_MS - (Date.now() - lastSendAt))
if (waitForGap > 0) await delay(waitForGap)
try {
return await task()
} finally {
lastSendAt = Date.now()
}
}
const nextTask = sendQueue.then(run, run)
sendQueue = nextTask.catch(() => {})
return nextTask
}
const withRateRetry = async (label, task) => {
let attempt = 0
while (attempt < MAX_RATE_RETRY) {
try {
return await queueOutbound(task)
} catch (err) {
attempt += 1
if (!isRateOverlimitError(err) || attempt >= MAX_RATE_RETRY) throw err
const waitMs = Math.min(12000, 1500 * attempt)
logInfo('RATE-LIMIT', `${label} kena overlimit, retry ${attempt}/${MAX_RATE_RETRY - 1} dalam ${waitMs}ms`, 'yellow')
await delay(waitMs)
}
}
}
const rawSendMessage = NanoBotz.sendMessage.bind(NanoBotz)
NanoBotz.sendMessage = async (...args) => withRateRetry('sendMessage', () => rawSendMessage(...args))
const rawRelayMessage = NanoBotz.relayMessage.bind(NanoBotz)
NanoBotz.relayMessage = async (...args) => withRateRetry('relayMessage', () => rawRelayMessage(...args))
const normalizeGroupMetadata = (metadata = {}) => ({
...metadata,
participants: Array.isArray(metadata.participants)
? metadata.participants.map(participant => ({
...participant,
id: participant.id || participant.jid || participant.lid || '',
jid: participant.jid || participant.id || '',
lid: participant.lid || (String(participant.id || '').endsWith('@lid') ? participant.id : '')
}))
: []
})
const rawGroupMetadata = NanoBotz.groupMetadata.bind(NanoBotz)
NanoBotz.groupMetadata = async (jid, force = false) => {
const groupJid = String(jid || '')
const fallbackMetadata = {
id: groupJid,
subject: '',
owner: '',
participants: [],
addressingMode: 'pn'
}
if (!groupJid) return fallbackMetadata
const cacheKey = `group-meta:${groupJid}`
if (!force) {
const cached = groupMetadataCache.get(cacheKey)
if (cached) return cached
}
if (groupMetadataInflight.has(cacheKey)) return groupMetadataInflight.get(cacheKey)
const task = (async () => {
try {
const metadata = normalizeGroupMetadata(await withRateRetry('groupMetadata', () => rawGroupMetadata(groupJid)) || fallbackMetadata)
if (metadata) groupMetadataCache.set(cacheKey, metadata)
return metadata
} catch (err) {
const cached = groupMetadataCache.get(cacheKey)
if (cached) {
logInfo('GROUPMETA', `Pakai cache metadata untuk ${groupJid}: ${err?.message || err}`, 'yellow')
return cached
}
if (isRateOverlimitError(err)) {
logInfo('GROUPMETA', `Metadata ${groupJid} kena overlimit, pakai fallback kosong`, 'yellow')
return fallbackMetadata
}
throw err
} finally {
groupMetadataInflight.delete(cacheKey)
}
})()
groupMetadataInflight.set(cacheKey, task)
return task
}
const rawNewsletterFollow = typeof NanoBotz.newsletterFollow === 'function' ? NanoBotz.newsletterFollow.bind(NanoBotz) : null
if (rawNewsletterFollow) {
NanoBotz.newsletterFollow = async (...args) => {
try {
return await withRateRetry('newsletterFollow', () => rawNewsletterFollow(...args))
} catch (err) {
logInfo('NEWSLETTER', `Follow channel dilewati: ${err?.message || err}`, 'yellow')
return null
}
}
}
if (!NanoBotz.authState.creds.registered) {
const phoneNumber = await question(chalk.cyan('\nMasukan nomor aktif diawali 62:\n> '));
const pairingnano = "DANZNANO";
let code = await NanoBotz.requestPairingCode(phoneNumber, pairingnano);
code = code?.match(/.{1,4}/g)?.join("-") || code;
logBox('PAIRING CODE', [
	`${chalk.white('Nomor :')} ${chalk.cyan(phoneNumber)}`,
	`${chalk.white('Kode  :')} ${chalk.green.bold(code)}`,
	`${chalk.white('Info  :')} buka WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon`,
], 'green')
}
    store.bind(NanoBotz.ev)
NanoBotz.ev.on('connection.update', async (update) => {
	const {
		connection,
		lastDisconnect
	} = update
try{
		if (connection === 'close') {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode
			if (reason === DisconnectReason.badSession) {
				logInfo('SESSION', 'Bad session file, hapus folder session lalu pairing ulang', 'red');
				NanoBotzInd()
			} else if (reason === DisconnectReason.connectionClosed) {
				logInfo('RECONNECT', 'Connection closed, mencoba reconnect', 'yellow');
				NanoBotzInd();
			} else if (reason === DisconnectReason.connectionLost) {
				logInfo('RECONNECT', 'Connection lost dari server, mencoba reconnect', 'yellow');
				NanoBotzInd();
			} else if (reason === DisconnectReason.connectionReplaced) {
				logInfo('SESSION', 'Connection replaced, sesi lain sedang aktif', 'red');
				NanoBotzInd()
			} else if (reason === DisconnectReason.loggedOut) {
				logInfo('SESSION', 'Device logged out, pairing ulang diperlukan', 'red');
				NanoBotzInd();
			} else if (reason === DisconnectReason.restartRequired) {
				logInfo('RESTART', 'Restart required, menjalankan ulang koneksi', 'yellow');
				NanoBotzInd();
			} else if (reason === DisconnectReason.timedOut) {
				logInfo('RECONNECT', 'Connection timeout, mencoba reconnect', 'yellow');
				NanoBotzInd();
			} else {
			  logInfo('RECONNECT', `Unknown disconnect reason: ${reason} | ${connection}`, 'yellow')
			  NanoBotzInd();
			}
		}
		if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
			logInfo('CONNECTING', 'Menghubungkan ke WhatsApp...', 'yellow')
		}
		if (update.connection == "open" || update.receivedPendingNotifications == "true") {
			await delay(1999)
logBox('BOT ONLINE', [
	`${chalk.white('User :')} ${chalk.cyan(NanoBotz.user?.name || global.botname)}`,
	`${chalk.white('JID  :')} ${chalk.cyan(NanoBotz.user?.id || '-')}`,
	`${chalk.white('Mode :')} ${chalk.green(NanoBotz.public ? 'Public' : 'Self')}`,
	`${chalk.white('Ready:')} ${chalk.green('Menunggu pesan masuk')}`,
], 'green')
await NanoBotz.newsletterFollow('120363418977603376@newsletter')
		}
} catch (err) {
	  logInfo('ERROR', `connection.update: ${err.message || err}`, 'red')
	  NanoBotzInd();
	}
	
})
await delay(5555) 
start('2', colors.bold.white('Bot siap menerima pesan...'))

NanoBotz.ev.on('creds.update', await saveCreds)

    // Anti Call
    NanoBotz.ev.on('call', async (XeonPapa) => {
    let botNumber = await NanoBotz.decodeJid(NanoBotz.user.id)
    let XeonBotNum = db.settings[botNumber].anticall
    if (!XeonBotNum) return
    logInfo('CALL', JSON.stringify(XeonPapa), 'yellow')
    for (let XeonFucks of XeonPapa) {
    if (XeonFucks.isGroup == false) {
    if (XeonFucks.status == "offer") {
    let XeonBlokMsg = await NanoBotz.sendTextWithMentions(XeonFucks.from, `*${NanoBotz.user.name}* can't receive ${XeonFucks.isVideo ? `video` : `voice` } call. Sorry @${XeonFucks.from.split('@')[0]} you will be blocked. If accidentally please contact the owner to be unblocked !`)
    NanoBotz.sendContact(XeonFucks.from, global.owner, XeonBlokMsg)
    await sleep(8000)
    await NanoBotz.updateBlockStatus(XeonFucks.from, "block")
    }
    }
    }
    })
NanoBotz.ev.on('messages.upsert', async chatUpdate => {
try {
const kay = chatUpdate.messages[0]
if (!kay.message) return
kay.message = (Object.keys(kay.message)[0] === 'ephemeralMessage') ? kay.message.ephemeralMessage.message : kay.message
if (kay.key && kay.key.remoteJid === 'status@broadcast')  {
await NanoBotz.readMessages([kay.key]) }
if (!NanoBotz.public && !kay.key.fromMe && chatUpdate.type === 'notify') return
const keyId = String(kay?.key?.id || '')
if (keyId.startsWith('BAE5') && keyId.length === 16) return
const m = await smsg(NanoBotz, kay, store)
if (kay?.key?.remoteJid && m?.chat) NanoBotz.rememberLidMap(kay.key.remoteJid, m.chat)
if (kay?.key?.participant && m?.sender) NanoBotz.rememberLidMap(kay.key.participant, m.sender)
if (kay?.key?.participantPn && kay?.key?.participant) NanoBotz.rememberLidMap(kay.key.participant, `${kay.key.participantPn}@s.whatsapp.net`)
require('./Nano')(NanoBotz, m, chatUpdate, store)
} catch (err) {
logInfo('ERROR', err.stack || err, 'red')}})
    async function getMessage(key){
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id)
            return msg?.message
        }
        return {
            conversation: "Dansya Bot Ada Di Sini"
        }
    }
    NanoBotz.ev.on('messages.update', async chatUpdate => {
        for(const { key, update } of chatUpdate) {
			if(update.pollUpdates && !key.fromMe) {
				const pollCreation = await getMessage(key)
				if(pollCreation) {
				    const pollUpdate = await getAggregateVotesInPollMessage({
							message: pollCreation,
							pollUpdates: update.pollUpdates,
						})
	                var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name
	                if (toCmd == undefined) return
                    var prefCmd = prefix+toCmd
	                NanoBotz.appenTextMessage(prefCmd, chatUpdate)
				}
			}
		}
    })
NanoBotz.sendTextWithMentions = async (jid, text, quoted, options = {}) => NanoBotz.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

NanoBotz.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}
NanoBotz.lidMap = NanoBotz.lidMap || {}
NanoBotz.rememberLidMap = (lid = '', jid = '') => {
let l = NanoBotz.decodeJid(lid || '')
let j = NanoBotz.decodeJid(jid || '')
if (!/@lid$/.test(l)) return
if (!/@s\.whatsapp\.net$/.test(j)) return
NanoBotz.lidMap[l] = j
}

NanoBotz.ev.on('contacts.update', update => {
for (let contact of update) {
let id = NanoBotz.decodeJid(contact.id)
if (contact?.lid && contact?.id) NanoBotz.rememberLidMap(contact.lid, contact.id)
if (/@lid$/.test(id) && contact?.phoneNumber) NanoBotz.rememberLidMap(id, `${contact.phoneNumber}@s.whatsapp.net`)
if (store && store.contacts) store.contacts[id] = { ...contact, id, name: contact.notify }
}
})
NanoBotz.getName = (jid, withoutContact  = false) => {
id = NanoBotz.decodeJid(jid)
withoutContact = NanoBotz.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = NanoBotz.groupMetadata(id) || {}
resolve(v.name || v.subject || jidDisplayName(id))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === NanoBotz.decodeJid(NanoBotz.user.id) ?
NanoBotz.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || jidDisplayName(jid)
}

NanoBotz.parseMention = (text = '') => {
return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

NanoBotz.sendContact = async (jid, kon, quoted = '', opts = {}) => {
	let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await NanoBotz.getName(i),
	    	vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await NanoBotz.getName(i)}\nFN:${await NanoBotz.getName(i)}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${ytname}\nitem2.X-ABLabel:YouTube\nitem3.URL:${socialm}\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${location};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
	    })
	}
	NanoBotz.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
    }
NanoBotz.setStatus = (status) => {
NanoBotz.query({
tag: 'iq',
attrs: {
to: '@s.whatsapp.net',
type: 'set',
xmlns: 'status',
},
content: [{
tag: 'status',
attrs: {},
content: Buffer.from(status, 'utf-8')
}]
})
return status
}

NanoBotz.public = true

NanoBotz.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await NanoBotz.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

NanoBotz.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await NanoBotz.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
.then( response => {
fs.unlinkSync(buffer)
return response
})
}

NanoBotz.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}
await NanoBotz.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

NanoBotz.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message
}
}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo
}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo
}
} : {})
} : {})
await NanoBotz.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage
}

NanoBotz.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}

NanoBotz.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

NanoBotz.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'}
filename = path.join(__filename, './lib' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
size: await getSizeMedia(data),
...type,
data}}

NanoBotz.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
let types = await NanoBotz.getFile(path, true)
let { mime, ext, res, data, filename } = types
if (res && res.status !== 200 || file.length <= 65536) {
try { throw { json: JSON.parse(file.toString()) } }
catch (e) { if (e.json) throw e.json }}
let type = '', mimetype = mime, pathFile = filename
if (options.asDocument) type = 'document'
if (options.asSticker || /webp/.test(mime)) {
let { writeExif } = require('./lib/exif')
let media = { mimetype: mime, data }
pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] })
await fs.promises.unlink(filename)
type = 'sticker'
mimetype = 'image/webp'}
else if (/image/.test(mime)) type = 'image'
else if (/video/.test(mime)) type = 'video'
else if (/audio/.test(mime)) type = 'audio'
else type = 'document'
await NanoBotz.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
return fs.promises.unlink(pathFile)}

NanoBotz.sendText = (jid, text, quoted = '', options) => NanoBotz.sendMessage(jid, { text: text, ...options }, { quoted })

NanoBotz.serializeM = async (m) => smsg(NanoBotz, m, store)

NanoBotz.before = async (teks) => smsg(NanoBotz, m, store)

NanoBotz.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
let buttonMessage = {
text,
footer,
buttons,
headerType: 2,
...options
}
NanoBotz.sendMessage(jid, buttonMessage, { quoted, ...options })
}

NanoBotz.sendKatalog = async (jid , title = '' , desc = '', gam , options = {}) =>{
let message = await prepareWAMessageMedia({ image: gam }, { upload: NanoBotz.waUploadToServer })
const tod = generateWAMessageFromContent(jid,
{"productMessage": {
"product": {
"productImage": message.imageMessage,
"productId": "9999",
"title": title,
"description": desc,
"currencyCode": "INR",
"priceAmount1000": "100000",
"url": `${websitex}`,
"productImageCount": 1,
"salePriceAmount1000": "0"
},
"businessOwnerJid": `${ownernumber}@s.whatsapp.net`
}
}, options)
return NanoBotz.relayMessage(jid, tod.message, {messageId: tod.key.id})
} 

NanoBotz.send5ButLoc = async (jid , text = '' , footer = '', img, but = [], options = {}) =>{
var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
templateMessage: {
hydratedTemplate: {
"hydratedContentText": text,
"locationMessage": {
"jpegThumbnail": img },
"hydratedFooterText": footer,
"hydratedButtons": but
}
}
}), options)
NanoBotz.relayMessage(jid, template.message, { messageId: template.key.id })
}
global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name]: name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({
    ...query, ...(apikeyqueryname ? {
        [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name]: name]
    }: {})
})): '')

NanoBotz.sendButImg = async (jid, path, teks, fke, but) => {
let img = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let fjejfjjjer = {
image: img, 
jpegThumbnail: img,
caption: teks,
fileLength: "1",
footer: fke,
buttons: but,
headerType: 4,
}
NanoBotz.sendMessage(jid, fjejfjjjer, { quoted: m })
}

            /**
             * Send Media/File with Automatic Type Specifier
             * @param {String} jid
             * @param {String|Buffer} path
             * @param {String} filename
             * @param {String} caption
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
             * @param {Boolean} ptt
             * @param {Object} options
             */
NanoBotz.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
  let type = await NanoBotz.getFile(path, true);
  let { res, data: file, filename: pathFile } = type;

  if (res && res.status !== 200 || file.length <= 65536) {
    try {
      throw {
        json: JSON.parse(file.toString())
      };
    } catch (e) {
      if (e.json) throw e.json;
    }
  }

  let opt = {
    filename
  };

  if (quoted) opt.quoted = quoted;
  if (!type) options.asDocument = true;

  let mtype = '',
    mimetype = type.mime,
    convert;

  if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
  else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
  else if (/video/.test(type.mime)) mtype = 'video';
  else if (/audio/.test(type.mime)) {
    convert = await (ptt ? toPTT : toAudio)(file, type.ext);
    file = convert.data;
    pathFile = convert.filename;
    mtype = 'audio';
    mimetype = 'audio/ogg; codecs=opus';
  } else mtype = 'document';

  if (options.asDocument) mtype = 'document';

  delete options.asSticker;
  delete options.asLocation;
  delete options.asVideo;
  delete options.asDocument;
  delete options.asImage;

  let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
  let m;

  try {
    m = await NanoBotz.sendMessage(jid, message, { ...opt, ...options });
  } catch (e) {
    //console.error(e)
    m = null;
  } finally {
    if (!m) m = await NanoBotz.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
    file = null;
    return m;
  }
}
NanoBotz.ev.on('group-participants.update', async (anu) => {
const { welcome } = require ('./lib/welcome')
const iswel = _welcome.includes(anu.id)
const isLeft = _left.includes(anu.id)
welcome(iswel, isLeft, NanoBotz, anu)
})

NanoBotz.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
     return NanoBotz.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options}, { quoted: quoted, ...options})
      }
      let type = mime.split("/")[0]+"Message"
      if(mime === "application/pdf"){
     return NanoBotz.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options}, { quoted: quoted, ...options })
      }
      if(mime.split("/")[0] === "image"){
     return NanoBotz.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options}, { quoted: quoted, ...options})
      }
      if(mime.split("/")[0] === "video"){
     return NanoBotz.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options}, { quoted: quoted, ...options })
      }
      if(mime.split("/")[0] === "audio"){
     return NanoBotz.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options}, { quoted: quoted, ...options })
      }
      }
      
      /**
     * 
     * @param {*} jid 
     * @param {*} name 
     * @param [*] values 
     * @returns 
     */
    NanoBotz.sendPoll = (jid, name = '', values = [], selectableCount = 1) => { return NanoBotz.sendMessage(jid, { poll: { name, values, selectableCount }}) }

return NanoBotz

}
NanoBotzInd()

process.on('uncaughtException', function (err) {
logInfo('UNCAUGHT', err.stack || err, 'red')
})
