addEventListener("load", () => {
    const menu = document.querySelectorAll("#kanban_menu .btn");
    menu.forEach((item, index) => {
        item.addEventListener("click", () => {
            menu.forEach(elem => {
                elem.className = "btn btn-block btn-outline-primary rounded-0";
            })
            item.classList.add("active");

            document.querySelectorAll(".kanban-box").forEach((elem) => {
                elem.className = "kanban-box p-2 d-none"
            })

            let boxname = item.getAttribute("menu-name")
            document.querySelector("#kanban_" + boxname).className = "kanban-box p-2"
        })
    });

    // Kanban Form
    const k_form = document.querySelector("#kanban_form");
    const input_form = k_form.querySelectorAll("[form-sizerun] input[sizerun]");
    const balance_form = k_form.querySelectorAll("[form-sizerun] .balance-sizerun")
    input_form.forEach((item) => {
        item.addEventListener("change", kanban_form);
    })
    balance_form.forEach((item) => {
        item.addEventListener("change", kanban_form);
    })
    const form_save = document.querySelector("[form-save]")
    form_save.addEventListener("click", () => {
        kanban_form(1)
    })

    if (sessionStorage.getItem("kanban")) {
        console.log("sesi dikembalikan")
        let data = JSON.parse(sessionStorage.getItem("kanban"))
        let d = document.querySelector("#kanban_form");
        let qty = d.querySelector("#kanban_qty")
        let input_sizerun = d.querySelectorAll("input[sizerun='']")
        input_sizerun.forEach((item, index) => {
            item.value = data[0].sizerun[index]
        })

        let balance_sizerun = d.querySelectorAll("[form-sizerun] input.balance-sizerun")
        balance_sizerun.forEach((item, index) => {
            item.value = data[0].balance[index]
        })

        qty.value = data[0].qty
        d.querySelector("[balance-total] input[sizerun=total]").value = data[0].sizerun[data[0].sizerun.length - 1]
        d.querySelector("[balance-total] input.balance-sizerun").value = data[0].balance[data[0].balance.length - 1]
        kanbanSet()
    } else {
        console.log("tidak ada sesi")
    }


    //Kanban Input
    const k_input = document.querySelector("#kanban_input");
    const d_input = k_input.querySelectorAll("[input-data] input")
    d_input.forEach((item, index) => {
        item.addEventListener("change", kanbanInput)
    })
})

function kanban_form(x) {
    const d = document.querySelector("#kanban_form")
    const input_sizerun = d.querySelectorAll("input[sizerun='']")

    // Ambil qty
    const d_qty = d.querySelector("#kanban_qty").value

    // Ambil sizerun
    const d_sizerun = []
    input_sizerun.forEach((item) => {
        d_sizerun.push(parseInt(item.value))
    })

    // ambil balance
    const d_balance = []
    d.querySelectorAll("[form-sizerun] input.balance-sizerun").forEach(item => {
        d_balance.push(parseInt(item.value))
    })

    const balance_total = d_balance.reduce((a, b) => a + b);
    const input_total = d_sizerun.reduce((a, b) => a + b);

    d.querySelector("[balance-total] input[sizerun=total]").value = input_total
    d.querySelector("[balance-total] input.balance-sizerun").value = balance_total

    d_sizerun.push(input_total)
    d_balance.push(balance_total)

    if (x == 1) {
        if(d_qty != ""){
            const kanban = [];
            kanban.push({ "qty": d_qty, "sizerun": d_sizerun, "balance": d_balance })
            sessionStorage.setItem("kanban", JSON.stringify(kanban))
            sessionStorage.setItem("bon", JSON.stringify([]))
            kanbanSet()
        } else {
            alert("Qty wajib diisi")
        }
    }
}

function kanbanSet() {
    const data = JSON.parse(sessionStorage.getItem("kanban"))
    const d = document.querySelector("#kanban_set")
    d.querySelector("[kanban-name=qty]").innerHTML = data[0].qty

    d.querySelectorAll("[kanban-name=sizerun] th").forEach((item, index) => {
        item.innerHTML = data[0].sizerun[index]
    });

    const kanbanRow = d.querySelectorAll("[kanban-name=input] tr")
    const bon = JSON.parse(sessionStorage.getItem("bon"))
    const baris = kanbanRow[0].cloneNode(true)

    if(bon.length == 0){

    } else {
        d.querySelector("[kanban-name=input]").innerHTML =""
        for (let i = 0; i < bon.length; i++) {
            const row = baris.cloneNode(true)
            row.querySelectorAll("td").forEach((item,index) => {
                item.innerHTML = bon[i][index]
            });
            d.querySelector("[kanban-name=input]").appendChild(row)
        }
    }

    const size3t = d.querySelectorAll("[kanban-name=input] [d-size='3T']")
    const size4 = d.querySelectorAll("[kanban-name=input] [d-size='4']")
    const size4t = d.querySelectorAll("[kanban-name=input] [d-size='4T']")
    const size5 = d.querySelectorAll("[kanban-name=input] [d-size='5']")
    const size5t = d.querySelectorAll("[kanban-name=input] [d-size='5T']")
    const size6 = d.querySelectorAll("[kanban-name=input] [d-size='6']")
    const size6t = d.querySelectorAll("[kanban-name=input] [d-size='6T']")
    const size7 = d.querySelectorAll("[kanban-name=input] [d-size='7']")

    const arr_3t = [];
    size3t.forEach(item => {
        arr_3t.push(parseInt(item.innerHTML))
    });
    const arr_4 = []
    size4.forEach(item => {
        arr_4.push(parseInt(item.innerHTML))
    })
    const arr_4t = []
    size4t.forEach(item => {
        arr_4t.push(parseInt(item.innerHTML))
    })
    const arr_5 = []
    size5.forEach(item => {
        arr_5.push(parseInt(item.innerHTML))
    })
    const arr_5t = []
    size5t.forEach(item => {
        arr_5t.push(parseInt(item.innerHTML))
    })
    const arr_6 = []
    size6.forEach(item => {
        arr_6.push(parseInt(item.innerHTML))
    })
    const arr_6t = []
    size6t.forEach(item => {
        arr_6t.push(parseInt(item.innerHTML))
    })
    const arr_7 = []
    size7.forEach(item => {
        arr_7.push(parseInt(item.innerHTML))
    })

    sizerun(arr_3t, 0)
    sizerun(arr_4, 1)
    sizerun(arr_4t, 2)
    sizerun(arr_5, 3)
    sizerun(arr_5t, 4)
    sizerun(arr_6, 5)
    sizerun(arr_6t, 6)
    sizerun(arr_7, 7)

    const tfoot = document.querySelectorAll("[kanban-name=sisa] td")
    const sisa = []
    tfoot.forEach((item) => {
        sisa.push(parseInt(item.innerHTML))
    })

    const sisaTotal = sisa.reduce((a, b) => a + b)
    tfoot[tfoot.length - 1].innerHTML = sisaTotal
    document.querySelectorAll("#kanban_input [reminder]")[tfoot.length - 1].innerHTML = sisaTotal
}

function kanbanInput(n) {
    const d = document.querySelector("#kanban_input")
    const inputan = d.querySelectorAll("[input-data] input[type=number]")

    const arr_input = []
    inputan.forEach((item, index) => {
        arr_input.push(parseInt(item.value))
    });

    const total = arr_input.reduce((a, b) => a + b);
    d.querySelector("[input-total] input").value = total
    if(n==1){
        arr_input.push(total);
        return arr_input;
    }
}

function sizerun(input, x) {
    const tfoot = document.querySelectorAll("[kanban-name=sisa] td")
    const total = input.reduce((a, b) => a + b)
    const lotbasis = parseInt(document.querySelectorAll("[kanban-name=sizerun] th")[x].innerHTML)
    tfoot[x].innerHTML = lotbasis - total

    document.querySelectorAll("#kanban_input [input-data] [reminder]")[x].innerHTML = lotbasis - total
}

function inputData() {
    if (sessionStorage.getItem("kanban")) {
        const d = document.querySelector("#kanban_input")
        const inputan = d.querySelectorAll("[input-data] input[type=number]")
        const input = kanbanInput(1)
        const data = JSON.parse(sessionStorage.getItem("bon"))
        data.push(input)

        sessionStorage.setItem("bon", JSON.stringify(data));
        kanbanSet()
    } else {
        alert("Buat kanban dulu")
    }
}