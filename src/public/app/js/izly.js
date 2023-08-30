document.addEventListener("alpine:init", () => {
  Alpine.data("izly", function () {
    return {
      connected: false,
      code: "",
      email: this.$persist(""),
      encrypted_code: this.$persist(""),
      balance: this.$persist(""),
      qrcode: this.$persist(""),

      async update() {
        if (this.email.length && this.encrypted_code.length) {
          if (navigator.onLine) {
            try {
              const [{ Src: qrcode }, balance] = await (await fetch(
                "https://api.licence-informatique-lemans.tk/v2/izly-qrcode.json",
                {
                  method: "post",
                  body: JSON.stringify({
                    email: this.email,
                    code: this.encrypted_code,
                  }),
                },
              )).json();

              this.qrcode = qrcode;
              this.balance = balance.toString().replace(".", ",");
            } catch {}
          }

          await this.$nextTick();

          this.connected = true;

          return;
        }

        this.connected = false;
      },

      switch_account() {
        this.email =
          this.code =
          this.encrypted_code =
          this.balance =
          this.qrcode =
            "";

        this.update();
      },

      submit() {
        const i = [...this.code].reduce((accumulator, x) => {
          return {
            x: accumulator.x + (!+x && !accumulator.c),
            c: accumulator.c + +x,
          };
        }, { x: 0, c: 0 }).x;
        const j = 8 + Math.round(Math.random() * 28);

        this.encrypted_code = j + (+this.code + this.email.length).toString(j) +
          j.toString().length + i;

        this.update();
      },
    };
  });
});
