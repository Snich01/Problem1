import axios from "axios";
import * as config from "./config.json";
import BigNumber from "bignumber.js"
import {serverResponse} from "./types/types"

const urlLastBlock = "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber"
const urlNumberBlock = "https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&boolean=true&tag="

let users: { [k: string]: any } = {}

const getAddress = async () => {

    try {
        const response_data = await axios.get(urlLastBlock)

        let lastBlock: number = (parseInt(response_data.data.result, 16))
        let currentBlock: number = lastBlock - 99;

        do {
            const data: serverResponse = await axios.get(generateURL(currentBlock.toString(16)))
            console.log("Current block:", currentBlock)

            if (data.data.message == "NOTOK") {
                console.log("request limit exceeded")
                await sleep(1000)
                continue
            }

            data.data.result.transactions.forEach(e => {
                let value: any = new BigNumber(e.value)
                let to: string = e.to
                let from: string = e.from

                if (!users[from]) {
                    users[from] = new BigNumber(0)
                }
                if (!users[to]) {
                    users[to] = new BigNumber(0)
                }

                users[from] = users[from].plus(value)
                users[to] = users[to].minus(value)
            })
            ++currentBlock

        } while (currentBlock <= lastBlock)

        console.log(findMax())
    } catch (error) {
        console.log(error)
    }
}

const generateURL = (i: string): string => {
    return `${urlNumberBlock}${i}&apikey=${config.apikey}`
}

const sleep = time =>
    new Promise(
        resolve => setTimeout(_ => resolve(), time)
    );

const findMax = (): string => {
    let max: any = new BigNumber(0)
    let address: string
    for (let key in users) {

        if (users[key].abs().gte(max)) {
            max = users[key].abs()
            address = key
        }
    }
    return address
}

getAddress()
