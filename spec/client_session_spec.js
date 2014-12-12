var PermessageDeflate = require('../lib/permessage_deflate'),
    zlib = require('zlib'),
    test = require('jstest').Test

test.describe("ClientSession", function() { with(this) {
  before(function() { with(this) {
    this.ext      = PermessageDeflate.configure(options)
    this.session  = ext.createClientSession()

    this.deflate  = zlibMock()
    this.inflate  = zlibMock()
    this.level    = zlib.Z_DEFAULT_LEVEL
    this.memLevel = zlib.Z_DEFAULT_MEMLEVEL
    this.strategy = zlib.Z_DEFAULT_STRATEGY

    this.message  = {data: "hello", rsv1: true}
  }})

  define("zlibMock", function() {
    var stream = {}

    this.stub(stream, "on").given("data").yields([new Buffer([0x00, 0x00, 0xff, 0xff])])
    this.stub(stream, "on").given("error", this.instanceOf(Function))
    this.stub(stream, "removeListener")

    this.stub(stream, "write")
    this.stub(stream, "flush").yields([])
    this.stub(stream, "close").raises(new Error("unexpected close()"))

    return stream
  })

  define("options",  {})
  define("response", {})

  define("offer", function() {
    if (this._offer === undefined) this._offer = this.session.generateOffer()
    return this._offer
  })

  define("activate", function() {
    if (this._activate === undefined) this._activate = this.session.activate(this.response)
    return this._activate
  })

  define("processIncomingMessage", function() {
    this.session.processIncomingMessage(this.message, function() {})
  })

  define("processOutgoingMessage", function() {
    this.session.processOutgoingMessage(this.message, function() {})
  })

  describe("with default options", function() { with(this) {
    it("indicates support for client_max_window_bits", function() { with(this) {
      assertEqual( {client_max_window_bits: true}, offer() )
    }})

    describe("with an empty response", function() { with(this) {
      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses context takeover and 15 window bits for inflating incoming messages", function() { with(this) {
        activate()
        expect(zlib, "createInflateRaw").given({windowBits: 15}).exactly(1).returning(inflate)
        processIncomingMessage()
        processIncomingMessage()
      }})

      it("uses context takeover and 15 window bits for deflating outgoing messages", function() { with(this) {
        activate()
        expect(zlib, "createDeflateRaw").given({windowBits: 15, level: level, memLevel: memLevel, strategy: strategy}).exactly(1).returning(deflate)
        processOutgoingMessage()
        processOutgoingMessage()
      }})
    }})

    describe("when the response includes server_no_context_takeover", function() { with(this) {
      define("response", {server_no_context_takeover: true})

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("ues no context takeover and 15 window bits for inflating incoming messages", function() { with(this) {
        activate()
        expect(zlib, "createInflateRaw").given({windowBits: 15}).exactly(2).returning(inflate)
        expect(inflate, "close").exactly(2)
        processIncomingMessage()
        processIncomingMessage()
      }})
    }})

    describe("when the response includes client_no_context_takeover", function() { with(this) {
      define("response", {client_no_context_takeover: true})

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses no context takeover and 15 window bits to deflate outgoing messages", function() { with(this) {
        activate()
        expect(zlib, "createDeflateRaw").given({windowBits: 15, level: level, memLevel: memLevel, strategy: strategy}).exactly(2).returning(deflate)
        expect(deflate, "close").exactly(2)
        processOutgoingMessage()
        processOutgoingMessage()
      }})
    }})

    describe("when the response includes server_max_window_bits", function() { with(this) {
      define("response", {server_max_window_bits: 8})

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses context takeover and 8 window bits for inflating incoming messages", function() { with(this) {
        activate()
        expect(zlib, "createInflateRaw").given({windowBits: 8}).exactly(1).returning(inflate)
        processIncomingMessage()
        processIncomingMessage()
      }})
    }})

    describe("when the response includes invalid server_max_window_bits", function() { with(this) {
      define("response", {server_max_window_bits: 20})

      it("rejects the response", function() { with(this) {
        assertEqual( false, activate() )
      }})
    }})

    describe("when the response includes client_max_window_bits", function() { with(this) {
      define("response", {client_max_window_bits: 8})

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses context takeover and 8 window bits for deflating outgoing messages", function() { with(this) {
        activate()
        expect(zlib, "createDeflateRaw").given({windowBits: 8, level: level, memLevel: memLevel, strategy: strategy}).exactly(1).returning(deflate)
        processOutgoingMessage()
        processOutgoingMessage()
      }})
    }})

    describe("when the response includes invalid client_max_window_bits", function() { with(this) {
      define("response", {client_max_window_bits: 20})

      it("rejects the response", function() { with(this) {
        assertEqual( false, activate() )
      }})
    }})
  }})

  describe("with noContextTakeover", function() { with(this) {
    define("options", {noContextTakeover: true})

    it("sends client_no_context_takeover", function() { with(this) {
      assertEqual( {client_no_context_takeover: true, client_max_window_bits: true}, offer() )
    }})

    describe("with an empty response", function() { with(this) {
      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses no context takeover and 15 window bits for deflating outgoing messages", function() { with(this) {
        activate()
        expect(zlib, "createDeflateRaw").given({windowBits: 15, level: level, memLevel: memLevel, strategy: strategy}).exactly(2).returning(deflate)
        expect(deflate, "close").exactly(2)
        processOutgoingMessage()
        processOutgoingMessage()
      }})
    }})
  }})

  describe("with maxWindowBits", function() { with(this) {
    define("options", {maxWindowBits: 9})

    it("sends client_max_window_bits", function() { with(this) {
      assertEqual( {client_max_window_bits: 9}, offer() )
    }})

    describe("with an empty response", function() { with(this) {
      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses context takeover and 9 window bits for deflating outgoing messages", function() { with(this) {
        activate()
        expect(zlib, "createDeflateRaw").given({windowBits: 9, level: level, memLevel: memLevel, strategy: strategy}).exactly(1).returning(deflate)
        processOutgoingMessage()
        processOutgoingMessage()
      }})
    }})

    describe("when the response has higher client_max_window_bits", function() { with(this) {
      define("response", {client_max_window_bits: 10})

      it("rejects the response", function() { with(this) {
        assertEqual( false, activate() )
      }})
    }})

    describe("when the response has lower client_max_window_bits", function() { with(this) {
      define("response", {client_max_window_bits: 8});

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses context takeover and 8 window bits for deflating outgoing messages", function() { with(this) {
        activate()
        expect(zlib, "createDeflateRaw").given({windowBits: 8, level: level, memLevel: memLevel, strategy: strategy}).exactly(1).returning(deflate)
        processOutgoingMessage()
        processOutgoingMessage()
      }})
    }})
  }})

  describe("with invalid maxWindowBits", function() { with(this) {
    define("options", {maxWindowBits: 20})

    it("throws when generating the offer", function() { with(this) {
      assertThrows(Error, function() { offer() })
    }})
  }})

  describe("with requestNoContextTakeover", function() { with(this) {
    define("options", {requestNoContextTakeover: true})

    it("sends server_no_context_takeover", function() { with(this) {
      assertEqual( {client_max_window_bits: true, server_no_context_takeover: true}, offer() )
    }})

    describe("with an empty response", function() { with(this) {
      it("rejects the response", function() { with(this) {
        assertEqual( false, activate() )
      }})
    }})

    describe("when the response includes server_no_context_takeover", function() { with(this) {
      define("response", {server_no_context_takeover: true})

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses no context takeover and 15 window bits for inflating incoming messages", function() { with(this) {
        activate()
        expect(zlib, "createInflateRaw").given({windowBits: 15}).exactly(2).returning(inflate)
        expect(inflate, "close").exactly(2)
        processIncomingMessage()
        processIncomingMessage()
      }})
    }})
  }})

  describe("with requestMaxWindowBits", function() { with(this) {
    define("options", {requestMaxWindowBits: 12})

    it("sends server_max_window_bits", function() { with(this) {
      assertEqual( { client_max_window_bits: true, server_max_window_bits: 12}, offer() )
    }})

    describe("with an empty response", function() { with(this) {
      it("rejects the response", function() { with(this) {
        assertEqual( false, activate() )
      }})
    }})

    describe("when the response has higher server_max_window_bits", function() { with(this) {
      define("response", {server_max_window_bits: 13})

      it("rejects the response", function() { with(this) {
        assertEqual( false, activate() )
      }})
    }})

    describe("when the response has lower server_max_window_bits", function() { with(this) {
      define("response", {server_max_window_bits: 11})

      it("accepts the response", function() { with(this) {
        assertEqual( true, activate() )
      }})

      it("uses context takeover and 11 window bits for inflating incoming messages", function() { with(this) {
        activate()
        expect(zlib, "createInflateRaw").given({windowBits: 11}).exactly(1).returning(inflate)
        processIncomingMessage()
        processIncomingMessage()
      }})
    }})
  }})

  describe("with invalid requestMaxWindowBits", function() { with(this) {
    define("options", {requestMaxWindowBits: 20})

    it("throws when generating the offer", function() { with(this) {
      assertThrows(Error, function() { offer() })
    }})
  }})

  describe("with level", function() { with(this) {
    define("options", {level: zlib.Z_BEST_SPEED})

    it("sets the level of the deflate stream", function() { with(this) {
      activate()
      expect(zlib, "createDeflateRaw").given({windowBits: 15, level: zlib.Z_BEST_SPEED, memLevel: memLevel, strategy: strategy}).returns(deflate)
      processOutgoingMessage()
    }})
  }})

  describe("with memLevel", function() { with(this) {
    define("options", {memLevel: 5})

    it("sets the memLevel of the deflate stream", function() { with(this) {
      activate()
      expect(zlib, "createDeflateRaw").given({windowBits: 15, level: zlib.Z_DEFAULT_LEVEL, memLevel: 5, strategy: strategy}).returns(deflate)
      processOutgoingMessage()
    }})
  }})

  describe("with strategy", function() { with(this) {
    define("options", {strategy: zlib.Z_FILTERED})

    it("sets the strategy of the deflate stream", function() { with(this) {
      activate()
      expect(zlib, "createDeflateRaw").given({windowBits: 15, level: zlib.Z_DEFAULT_LEVEL, memLevel: memLevel, strategy: zlib.Z_FILTERED}).returns(deflate)
      processOutgoingMessage()
    }})
  }})
}})
