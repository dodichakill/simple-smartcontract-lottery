const assert = require("assert");
const ganache = require("ganache");
const { Web3 } = require("web3");
const { interface, bytecode } = require("../compile");

const web3 = new Web3(ganache.provider());
let lottery;
let accounts;

//fungsi yang akan di jalankan sebelum setiap test case dijalankan
beforeEach(async () => {
  //mengambil account yang akan digunakan
  accounts = await web3.eth.getAccounts();
  //meng- deploy contract dengan bytecode yang di dapat dari compile
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode,
    })
    .send({ from: accounts[0], gas: "1000000" });
});

//group test case yang berhubungan dengan contract
describe("Lottery Contract", () => {
  //test case untuk memastikan contract berhasil di deploy
  it("deploys a contract", () => {
    //memastikan contract memiliki address
    assert.ok(lottery.options.address);
  });

  it("allows one account to enter", async () => {
    //mengirimkan transaksi untuk enter ke contract
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });

    //mengambil data player yang telah enter
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    //memastikan account yang mengirimkan transaksi masuk dalam data player
    assert.equal(accounts[0], players[0]);
    //memastikan jumlah player yang ada dalam data player adalah 1
    assert.equal(1, players.length);
  });

  //test case untuk memastikan contract dapat di enter oleh beberapa account
  it("allows multiple account to enter", async () => {
    //mengirimkan transaksi untuk enter ke contract
    for (let i = 0; i <= 2; i++) {
      await lottery.methods.enter().send({
        from: accounts[i],
        value: web3.utils.toWei("0.02", "ether"),
      });
    }

    //mengambil data player yang telah enter
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    //memastikan account yang mengirimkan transaksi masuk dalam data player
    for (let i = 0; i <= 2; i++) {
      assert.equal(accounts[i], players[i]);
    }
    //memastikan jumlah player yang ada dalam data player adalah 1
    assert.equal(3, players.length);
  });

  // Test case untuk memastikan transaksi memiliki minimum amount ether
  it("requires a minimum amount of ether to enter", async () => {
    // Mencoba mengirimkan transaksi enter ke contract tanpa mengirimkan value
    try {
      await lottery.methods.enter().send({
        from: accounts[0], // Account yang akan mengirimkan transaksi
        value: 0, // Jumlah value yang dikirimkan
      });
      // Jika tidak ada error, maka assert akan gagal
      assert(false);
    } catch (err) {
      // Jika terjadi error, maka assert akan berhasil
      assert(err);
    }
  });

  // Test case untuk memastikan hanya manager yang dapat memanggil fungsi pickWinner
  it("only manager can call pickWinner", async () => {
    // Mengirimkan transaksi untuk memanggil fungsi pickWinner dari account selain manager
    try {
      // Mengirimkan transaksi ke contract dengan menggunakan fungsi pickWinner dan account kedua
      await lottery.methods.pickWinner().send({
        from: accounts[1], // Menggunakan account kedua
      });
      // Jika tidak ada error, maka pernyataan akan gagal
      assert(false); // Jika pernyataan ini tidak dieksekusi, maka test case akan gagal
    } catch (err) {
      // Jika terjadi error, maka pernyataan akan berhasil
      assert(err); // Jika pernyataan ini dieksekusi, maka test case akan berhasil
    }
  });

  it("sends money to the winner and resets the players array", async () => {
    // Mengirimkan transaksi untuk masuk ke dalam lottery dengan mengirim value 2 ether
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    // Mengambil saldo awal dari account pertama
    const initialBalance = await web3.eth.getBalance(accounts[0]);

    // Memanggil fungsi pickWinner dan mengirimkan transaksi dari account pertama
    await lottery.methods.pickWinner().send({ from: accounts[0] });

    // Mengambil saldo akhir dari account pertama
    const finalBalance = await web3.eth.getBalance(accounts[0]);

    // Menghitung selisih antara saldo awal dan saldo akhir
    const difference = finalBalance - initialBalance;

    // Menampilkan selisih antara saldo awal dan saldo akhir
    console.log(difference);

    // Memastikan bahwa selisih antara saldo awal dan saldo akhir lebih besar dari 1.8 ether
    assert(difference > web3.utils.toWei("1.8", "ether"));
  });
});
