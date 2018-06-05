# Insight API Ulord

A Ulord blockchain REST and web socket API service for [Bitcore Node Ulord](https://github.com/UlordChain/bitcore-node-ulord).

This is a backend-only service. If you're looking for the web frontend application, take a look at https://github.com/UlordChain/insight-ui-ulord.

## Quick development guide

Please refer to [https://github.com/UlordChain/insight-ui-ulord/wiki](https://github.com/UlordChain/insight-ui-ulord/wiki), and you will know how to build a block browser.

## Start

```bash
git clone https://github.com/UlordChain/insight-api-ulord.git
```

The API endpoints will be available by default at: `http://localhost:3001/insight-api-ulord/`

## Prerequisites

- [Bitcore Node Ulord 3.x](https://github.com/UlordChain/bitcore-node-ulord)

**Note:** You can use an existing Ulord data directory, however `txindex`, `addressindex`, `timestampindex` and `spentindex` needs to be set to true in `ulord.conf`, as well as a few other additional fields.

## Notes on Upgrading from v0.3

The unspent outputs format now has `satoshis` and `height`:
```
[
  {
    "address":"mo9ncXisMeAoXwqcV5EWuyncbmCcQN4rVs",
    "txid":"d5f8a96faccf79d4c087fa217627bb1120e83f8ea1a7d84b1de4277ead9bbac1",
    "vout":0,
    "scriptPubKey":"76a91453c0307d6851aa0ce7825ba883c6bd9ad242b48688ac",
    "amount":0.000006,
    "satoshis":600,
    "confirmations":0,
    "ts":1461349425
  },
  {
    "address": "mo9ncXisMeAoXwqcV5EWuyncbmCcQN4rVs",
    "txid": "bc9df3b92120feaee4edc80963d8ed59d6a78ea0defef3ec3cb374f2015bfc6e",
    "vout": 1,
    "scriptPubKey": "76a91453c0307d6851aa0ce7825ba883c6bd9ad242b48688ac",
    "amount": 0.12345678,
    "satoshis: 12345678,
    "confirmations": 1,
    "height": 300001
  }
]
```
The `timestamp` property will only be set for unconfirmed transactions and `height` can be used for determining block order. The `confirmationsFromCache` is nolonger set or necessary, confirmation count is only cached for the time between blocks.

There is a new `GET` endpoint or raw blocks at `/rawblock/<blockHash>`:

Response format:
```
{
  "rawblock": "blockhexstring..."
}
```

There are a few changes to the `GET` endpoint for `/addr/[:address]`:

- The list of txids in an address summary does not include orphaned transactions
- The txids will be sorted in block order
- The list of txids will be limited at 1000 txids
- There are two new query options "from" and "to" for pagination of the txids (e.g. `/addr/[:address]?from=1000&to=2000`)

Some additional general notes:
- The transaction history for an address will be sorted in block order
- The response for the `/sync` endpoint does not include `startTs` and `endTs` as the sync is no longer relevant as indexes are built in bitcoind.
- The endpoint for `/peer` is no longer relevant connection to bitcoind is via ZMQ.
- `/tx` endpoint results will now include block height, and spentTx related fields will be set to `null` if unspent.
- `/block` endpoint results does not include `confirmations` and will include `poolInfo`.

## Notes on Upgrading from v0.2

Some of the fields and methods are not supported:

The `/tx/<txid>` endpoint JSON response will not include the following fields on the "vin"
object:
- `doubleSpentTxId` // double spends are not currently tracked
- `isConfirmed` // confirmation of the previous output
- `confirmations` // confirmations of the previous output
- `unconfirmedInput`

The `/tx/<txid>` endpoint JSON response will not include the following fields on the "vout"
object.
- `spentTs`

The `/status?q=getTxOutSetInfo` method has also been removed due to the query being very slow and locking bitcoind.

Plug-in support for Insight API is also no longer available, as well as the endpoints:
- `/email/retrieve`
- `/rates/:code`

Caching support has not yet been added in the v0.3 upgrade.

## Query Rate Limit

To protect the server, insight-api has a built it query rate limiter. It can be configurable in `bitcore-node.json` with:
``` json
  "servicesConfig": {
    "insight-api": {
      "rateLimiterOptions": {
        "whitelist": ["::ffff:127.0.0.1"]
      }
    }
  }
```
With all the configuration options available: https://github.com/bitpay/insight-api/blob/master/lib/ratelimiter.js#L10-17

Or disabled entirely with:
``` json
  "servicesConfig": {
    "insight-api": {
      "disableRateLimiter": true
    }
  }
  ```
  

## API HTTP Endpoints

### Block
```
  /insight-api-ulord/block/[:hash]
  /insight-api-ulord/block/00000000a967199a2fad0877433c93df785a8d8ce062e5f9b451cd1397bdbf62
```

### Block Index
Get block hash by height
```
  /insight-api-ulord/block-index/[:height]
  /insight-api-ulord/block-index/0
```
This would return:
```
{
  "blockHash":"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
}
```
which is the hash of the Genesis block (0 height)


### Raw Block
```
  /insight-api-ulord/rawblock/[:blockHash]
  /insight-api-ulord/rawblock/[:blockHeight]
```

This would return:
```
{
  "rawblock":"blockhexstring..."
}
```

### Block Summaries

Get block summaries by date:
```
  /insight-api-ulord/blocks?limit=3&blockDate=2016-04-22
```

Example response:
```
{
  "blocks": [
    {
      "height": 408495,
      "size": 989237,
      "hash": "00000000000000000108a1f4d4db839702d72f16561b1154600a26c453ecb378",
      "time": 1461360083,
      "txlength": 1695,
      "poolInfo": {
        "poolName": "BTCC Pool",
        "url": "https://pool.btcc.com/"
      }
    }
  ],
  "length": 1,
  "pagination": {
    "next": "2016-04-23",
    "prev": "2016-04-21",
    "currentTs": 1461369599,
    "current": "2016-04-22",
    "isToday": true,
    "more": true,
    "moreTs": 1461369600
  }
}
```

### Transaction
```
  /insight-api-ulord/tx/[:txid]
  /insight-api-ulord/tx/525de308971eabd941b139f46c7198b5af9479325c2395db7f2fb5ae8562556c
  /insight-api-ulord/rawtx/[:rawid]
  /insight-api-ulord/rawtx/525de308971eabd941b139f46c7198b5af9479325c2395db7f2fb5ae8562556c
```

### Address
```
  /insight-api-ulord/addr/[:addr][?noTxList=1][&from=&to=]
  /insight-api-ulord/addr/mmvP3mTe53qxHdPqXEvdu8WdC7GfQ2vmx5?noTxList=1
  /insight-api-ulord/addr/mmvP3mTe53qxHdPqXEvdu8WdC7GfQ2vmx5?from=1000&to=2000
```

### Address Properties
```
  /insight-api-ulord/addr/[:addr]/balance
  /insight-api-ulord/addr/[:addr]/totalReceived
  /insight-api-ulord/addr/[:addr]/totalSent
  /insight-api-ulord/addr/[:addr]/unconfirmedBalance
```
The response contains the value in Satoshis.

### Unspent Outputs
```
  /insight-api-ulord/addr/[:addr]/utxo
```
Sample return:
```
[
  {
    "address":"mo9ncXisMeAoXwqcV5EWuyncbmCcQN4rVs",
    "txid":"d5f8a96faccf79d4c087fa217627bb1120e83f8ea1a7d84b1de4277ead9bbac1",
    "vout":0,
    "scriptPubKey":"76a91453c0307d6851aa0ce7825ba883c6bd9ad242b48688ac",
    "amount":0.000006,
    "satoshis":600,
    "confirmations":0,
    "ts":1461349425
  },
  {
    "address": "mo9ncXisMeAoXwqcV5EWuyncbmCcQN4rVs",
    "txid": "bc9df3b92120feaee4edc80963d8ed59d6a78ea0defef3ec3cb374f2015bfc6e",
    "vout": 1,
    "scriptPubKey": "76a91453c0307d6851aa0ce7825ba883c6bd9ad242b48688ac",
    "amount": 0.12345678,
    "satoshis: 12345678,
    "confirmations": 1,
    "height": 300001
  }
]
```

### Unspent Outputs for Multiple Addresses
GET method:
```
  /insight-api-ulord/addrs/[:addrs]/utxo
  /insight-api-ulord/addrs/2NF2baYuJAkCKo5onjUKEPdARQkZ6SYyKd5,2NAre8sX2povnjy4aeiHKeEh97Qhn97tB1f/utxo
```

POST method:
```
  /insight-api-ulord/addrs/utxo
```

POST params:
```
addrs: 2NF2baYuJAkCKo5onjUKEPdARQkZ6SYyKd5,2NAre8sX2povnjy4aeiHKeEh97Qhn97tB1f
```

### InstantSend Transactions
If a Transaction Lock has been observed by Insight API a 'txlock' value of true will be included in the Transaction Object.

Sample output:
```
{
	"txid": "b7ef92d1dce458276f1189e06bf532eff78f9c504101d3d4c0dfdcd9ebbf3879",
	"version": 1,
	"locktime": 133366,
	"vin": [{ ... }],
	"vout": [{ ... }],
	"blockhash": "0000001ab9a138339fe4505a299525ace8cda3b9bcb258a2e5d93ed7a320bf21",
	"blockheight": 133367,
	"confirmations": 37,
	"time": 1483985187,
	"blocktime": 1483985187,
	"valueOut": 8.998,
	"size": 226,
	"valueIn": 8.999,
	"fees": 0.001,
	"txlock": true
}
```

### Transactions by Block
```
  /insight-api-ulord/txs/?block=HASH
  /insight-api-ulord/txs/?block=00000000fa6cf7367e50ad14eb0ca4737131f256fc4c5841fd3c3f140140e6b6
```
### Transactions by Address
```
  /insight-api-ulord/txs/?address=ADDR
  /insight-api-ulord/txs/?address=mmhmMNfBiZZ37g1tgg2t8DDbNoEdqKVxAL
```

### Transactions for Multiple Addresses
GET method:
```
  /insight-api-ulord/addrs/[:addrs]/txs[?from=&to=]
  /insight-api-ulord/addrs/2NF2baYuJAkCKo5onjUKEPdARQkZ6SYyKd5,2NAre8sX2povnjy4aeiHKeEh97Qhn97tB1f/txs?from=0&to=20
```

POST method:
```
  /insight-api-ulord/addrs/txs
```

POST params:
```
addrs: 2NF2baYuJAkCKo5onjUKEPdARQkZ6SYyKd5,2NAre8sX2povnjy4aeiHKeEh97Qhn97tB1f
from (optional): 0
to (optional): 20
noAsm (optional): 1 (will omit script asm from results)
noScriptSig (optional): 1 (will omit the scriptSig from all inputs)
noSpent (option): 1 (will omit spent information per output)
```

Sample output:
```
{ totalItems: 100,
  from: 0,
  to: 20,
  items:
    [ { txid: '3e81723d069b12983b2ef694c9782d32fca26cc978de744acbc32c3d3496e915',
       version: 1,
       locktime: 0,
       vin: [Object],
       vout: [Object],
       blockhash: '00000000011a135e5277f5493c52c66829792392632b8b65429cf07ad3c47a6c',
       confirmations: 109367,
       time: 1393659685,
       blocktime: 1393659685,
       valueOut: 0.3453,
       size: 225,
       firstSeenTs: undefined,
       valueIn: 0.3454,
       fees: 0.0001,
       txlock: false },
      { ... },
      { ... },
      ...
      { ... }
    ]
 }
```

Note: if pagination params are not specified, the result is an array of transactions.

### Transaction Broadcasting
POST method:
```
  /insight-api-ulord/tx/send
```
POST params:
```
  rawtx: "signed transaction as hex string"

  eg

  rawtx: 01000000017b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3f00000000494830450221008949f0cb400094ad2b5eb399d59d01c14d73d8fe6e96df1a7150deb388ab8935022079656090d7f6bac4c9a94e0aad311a4268e082a725f8aeae0573fb12ff866a5f01ffffffff01f0ca052a010000001976a914cbc20a7664f2f69e5355aa427045bc15e7c6c77288ac00000000

```
POST response:
```
  {
      txid: [:txid]
  }

  eg

  {
      txid: "c7736a0a0046d5a8cc61c8c3c2821d4d7517f5de2bc66a966011aaa79965ffba"
  }
```

### Budget Proposal List
GET method:
```
  /insight-api-ulord/gobject/list/proposal
```

Sample output:
```
    [ { Hash: 'b6af3e70c686f660541a77bc035df2e5e46841020699ce3ec8fad786f7d1aa35',
        DataObject: {
          end_epoch: 1513555200,
          name: 'flare03',
          payment_address: 'yViyoK3NwfH5GXRo7e4DEYkzzhBjDNQaQG',
          payment_amount: 5,
          start_epoch: 1482105600,
          type: 1,
          url: 'https://www.ulord.org'
        },
        AbsoluteYesCount: 40,
        YesCount: 40,
        NoCount: 0,
        AbstainCount: 0 } ]
```

### Budget Proposal Detail
GET method:
```
  /insight-api-ulord/gobject/get/[:hash]
  /insight-api-ulord/gobject/get/b6af3e70c686f660541a77bc035df2e5e46841020699ce3ec8fad786f7d1aa35
```

Sample output:
```
    [ { Hash: 'b6af3e70c686f660541a77bc035df2e5e46841020699ce3ec8fad786f7d1aa35',
        CollateralHash: '24a71d8f221659717560365d2914bc7a00f82ffb8f8c68e7fffce5f35aa23b90',
       	DataHex: '5b5b2270726f706f73616c222c7b22656e645f65706f6368223a313531333535353230302c226e616d65223a22666c6172653033222c227061796d656e745f61646472657373223a22795669796f4b334e776648354758526f3765344445596b7a7a68426a444e51615147222c227061796d656e745f616d6f756e74223a352c2273746172745f65706f6368223a313438323130353630302c2274797065223a312c2275726c223a2268747470733a2f2f64617368646f742e696f2f702f666c6172653033227d5d5d',
        DataObject: {
          end_epoch: 1513555200,
          name: 'flare03',
          payment_address: 'yViyoK3NwfH5GXRo7e4DEYkzzhBjDNQaQG',
          payment_amount: 5,
          start_epoch: 1482105600,
          type: 1,
          url: 'https://www.ulord.org'
        },
        CreationTime: 1482223714,
        FundingResult: {
            AbsoluteYesCount: 40,
            YesCount: 40,
            NoCount: 0,
            AbstainCount: 0
        },
        ValidResult: {
            AbsoluteYesCount: 74,
            YesCount: 74,
            NoCount: 0,
            AbstainCount: 0
        },
        DeleteResult: {
            AbsoluteYesCount: 0,
            YesCount: 0,
            NoCount: 0,
            AbstainCount: 0
        },
        EndorsedResult: {
            AbsoluteYesCount: 0,
            YesCount: 0,
            NoCount: 0,
            AbstainCount: 0
        } } ]
```


### Historic Blockchain Data Sync Status
```
  /insight-api-ulord/sync
```

### Live Network P2P Data Sync Status
```
  /insight-api-ulord/peer
```

### Status of the Bitcoin Network
```
  /insight-api-ulord/status?q=xxx
```

Where "xxx" can be:

 * getInfo
 * getDifficulty
 * getBestBlockHash
 * getLastBlockHash


### Utility Methods
```
  /insight-api-ulord/utils/estimatefee[?nbBlocks=2]
```


## Web Socket API
The web socket API is served using [socket.io](http://socket.io).

The following are the events published by insight:

`tx`: new transaction received from network, txlock boolean is set true if a matching txlock event has been observed. This event is published in the 'inv' room. Data will be a app/models/Transaction object.
Sample output:
```
{
  "txid":"00c1b1acb310b87085c7deaaeba478cef5dc9519fab87a4d943ecbb39bd5b053",
  "txlock": false,
  "processed":false
  ...
}
```

`txlock`: InstantSend transaction received from network, this event is published alongside the 'tx' event when a transaction lock event occurs. Data will be a app/models/Transaction object.
Sample output:
```
{
  "txid":"00c1b1acb310b87085c7deaaeba478cef5dc9519fab87a4d943ecbb39bd5b053",
  "processed":false
  ...
}
```

`block`: new block received from network. This event is published in the `inv` room. Data will be a app/models/Block object.
Sample output:
```
{
  "hash":"000000004a3d187c430cd6a5e988aca3b19e1f1d1727a50dead6c8ac26899b96",
  "time":1389789343,
  ...
}
```

`<bitcoinAddress>`: new transaction concerning <bitcoinAddress> received from network. This event is published in the `<bitcoinAddress>` room.

`status`: every 1% increment on the sync task, this event will be triggered. This event is published in the `sync` room.

Sample output:
```
{
  blocksToSync: 164141,
  syncedBlocks: 475,
  upToExisting: true,
  scanningBackward: true,
  isEndGenesis: true,
  end: "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943",
  isStartGenesis: false,
  start: "000000009f929800556a8f3cfdbe57c187f2f679e351b12f7011bfc276c41b6d"
}
```

### Example Usage

The following html page connects to the socket.io insight API and listens for new transactions.

html
```
<html>
<body>
  <script src="http://<insight-server>:<port>/socket.io/socket.io.js"></script>
  <script>
    eventToListenTo = 'tx'
    room = 'inv'

    var socket = io("http://<insight-server>:<port>/");
    socket.on('connect', function() {
      // Join the room.
      socket.emit('subscribe', room);
    })
    socket.on(eventToListenTo, function(data) {
      if (data.txlock) {
        console.log("New InstantSend transaction received: " + data.txid)
      } else {
        console.log("New transaction received: " + data.txid)
      }
    })
  </script>
</body>
</html>
```

## License
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
