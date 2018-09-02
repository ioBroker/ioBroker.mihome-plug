const crypto = require('crypto');

function Packet(token) {
    // Properties
    this.magic =     new Buffer( 2);
    this.len =       new Buffer( 2);
    this.unknown =   new Buffer( 4);
    this.serial =    new Buffer( 4);
    this.stamp =     new Buffer( 4);
    this.checksum =  new Buffer(16);
    this.data =      new Buffer( 0);
    this.token =     new Buffer(16);
    this.key =       new Buffer(16);
    this.iv =        new Buffer(16);
    this.plainMessageOut = '';

    // Methods
    this.msgCounter = 1;

    // Functions and internal functions
    this.setHelo = function () {
        this.magic =     new Buffer('2131', 'hex');
        this.len =       new Buffer('0020', 'hex');
        this.unknown =   new Buffer('FFFFFFFF', 'hex');
        this.serial =    new Buffer('FFFFFFFF', 'hex');
        this.stamp =     new Buffer('FFFFFFFF', 'hex');
        this.checksum =  new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex');
        this.data =      new Buffer(0);
    };

    this.getRaw = function () {
        if (this.data.length > 0) {
            this.len = new Buffer(decimalToHex(this.data.length + 32, 4), 'hex');
            const zwraw = new Buffer(this.magic.toString('hex') + this.len.toString('hex') + this.unknown.toString('hex') + this.serial.toString('hex') + this.stamp.toString('hex') + this.token.toString('hex') + this.data.toString('hex'), 'hex');
            //const zwraw = new Buffer(this.magic.toString('hex')+this.len.toString('hex')+this.unknown.toString('hex')+this.serial.toString('hex')+this.stamp.toString('hex')+"00000000000000000000000000000000"+this.data.toString('hex'),'hex');
            this.checksum = _md5(zwraw);
        }
        return (new Buffer(this.magic.toString('hex') + this.len.toString('hex') + this.unknown.toString('hex') + this.serial.toString('hex') + this.stamp.toString('hex') + this.checksum.toString('hex') + this.data.toString('hex'), 'hex'));
    };

    this.setRaw = function (raw) {
        const rawhex  = raw.toString('hex');
        this.magic    = new Buffer(rawhex.substr( 0,  4), 'hex');
        this.len      = new Buffer(rawhex.substr( 4,  4), 'hex');
        this.unknown  = new Buffer(rawhex.substr( 8,  8), 'hex');
        this.serial   = new Buffer(rawhex.substr(16,  8), 'hex');
        this.stamp    = new Buffer(rawhex.substr(24,  8), 'hex');
        this.checksum = new Buffer(rawhex.substr(32, 32), 'hex');
        this.data     = new Buffer(rawhex.substr(64),     'hex');
        if (this.data.length === 0 && rawhex.substr(32, 32) !== 'ffffffffffffffffffffffffffffffff') {
            this.setToken(this.checksum);
        }
    };

    this.setPlainData = function (plainData) {
        const cipher = crypto.createCipheriv('aes-128-cbc', this.key, this.iv);
        let crypted  = cipher.update(plainData, 'utf8', 'binary');
        crypted += cipher.final('binary');
        crypted = new Buffer(crypted, 'binary');
        this.data = crypted;
    };

    this.getPlainData = function () {
        const decipher = crypto.createDecipheriv('aes-128-cbc', this.key, this.iv);
        let dec = decipher.update(this.data, 'binary', 'utf8');
        dec += decipher.final('utf8');
        //dec = dec.substring(0, dec.length - 1);
        return dec;
    };

    function _md5(data) {
        return new Buffer(crypto.createHash('md5').update(data).digest('hex'), 'hex');
    }

    this.setToken = function (token) {
        this.token = token;
        this.key   = _md5(this.token);
        this.iv    = _md5(new Buffer(this.key.toString('hex') + this.token.toString('hex'), 'hex'));
    };

    // Call Initializer
    this.setHelo();

    if (token) {
        this.setToken(token);
    }
    return this;
}

function decimalToHex(decimal, chars) {
    return (decimal + Math.pow(16, chars)).toString(16).slice(-chars).toUpperCase();
}

function str2hex(str) {
    str = str.replace(/\s/g, '');
    const buf = new Buffer(str.length / 2);

    const len = str.length / 2;
    for (let i = 0; i < len; i++) {
        buf[i] = parseInt(str[i * 2] + str[i * 2 + 1], 16);
    }
    return buf;
}

exports.Packet       = Packet;
exports.decimalToHex = decimalToHex;
