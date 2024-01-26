
const gameCache = {
  '24': {},
  'arithmetic': {}
}

const custom_template_id = '102072007_1702987215'
const key = Array.from({ length: 10 }, (v, i) => `content${i}`)

export class game extends plugin {
  constructor() {
    super({
      name: '数字游戏',
      dsc: '数字游戏',
      event: 'message',
      priority: 1,
      rule: [
        {
          reg: /^#?数字游戏$/,
          fnc: 'help'
        },
        {
          reg: /^#?(24|60|72)点$/,
          fnc: 'start24'
        },
        {
          reg: /^#?解答\s*[\d\+\-\*\/\(\)\s]+$/,
          fnc: 'answer24'
        },
        {
          reg: /^#?结束(24|60|72)点$/,
          fnc: 'stop24'
        },
        {
          reg: /^#?算术对战$/,
          fnc: 'arithmeticPK'
        },
        {
          reg: /^#?填入\s*[\+\-x\/÷\*\·]$/,
          fnc: 'arithmetic'
        },
      ]
    })
  }
  async help(e) {
    const buttons = [
      [
        { text: '24点', callback: '/24点' },
        { text: '60点', callback: '/60点' },
        { text: '72点', callback: '/72点' },
      ],
      [
        { text: '算术对战', callback: '/算术对战' }
      ]
    ]
    const msg = [
      '#',
      '24点\r>随机给予4个数字通过+-*/计算出24\r\r#',
      '60点,72点\r>同24点,有5个数字\r\r#',
      '算术对战\r>(1 + ? - ?) x ? ÷ ?\r>依次给予4个1-9的数字,每次可选择填入其中某个?\r>最后计算谁的数字大谁就赢'
    ]
    return await reply(e, msg, buttons)
  }

  async start24(e) {
    const GameName = gameCache['24']
    const nowGame = GameName[e.group_id]
    const game = /^#?(24|60|72)点$/.exec(e.msg)[1]
    const buttons = [
      [
        { text: '解答', input: '/解答' },
        { text: '结束', callback: `/结束${game}点` }
      ]
    ]
    if (nowGame) return await reply(e, [`上一局游戏还未结束\r使用+-*/算出${nowGame.game}:\r${nowGame.question.join('  ')}`], buttons)
    const [question, answer] = random_question(game)
    GameName[e.group_id] = { question, answer, game }
    console.log(question, answer);
    return await reply(e, [`请使用以下数字通过+-*/算出${game}(可使用括号)\r发送'/解答'+答案:\r${question.join('  ')}`], buttons)
  }

  async answer24(e) {
    const GameName = gameCache['24']
    const nowGame = GameName[e.group_id]
    let buttons = [
      [
        { text: '24点', callback: '/24点' },
        { text: '60点', callback: '/60点' },
        { text: '72点', callback: '/72点' },
      ]
    ]
    if (!nowGame) return await reply(e, [`现在没有开局哦,请输入/24点来开始游戏!`], buttons)
    let msg = e.msg.replace(/#?解答\s*/, '')
    if (check_result(msg, nowGame.question, nowGame.game)) {
      delete GameName[e.group_id]
      return await reply(e, ['恭喜你回答正确!'], buttons)
    }
    buttons = [
      [
        { text: '解答', input: '/解答' },
        { text: '结束', callback: `/结束${nowGame.game}点` }
      ]
    ]
    return await reply(e, '答案不对或输入格式有误!(仅可使用+-*/和括号)', buttons)
  }

  async stop24(e) {
    const GameName = gameCache['24']
    const nowGame = GameName[e.group_id]
    let buttons = [
      [
        { text: '24点', callback: '/24点' },
        { text: '60点', callback: '/60点' },
        { text: '72点', callback: '/72点' },
      ]
    ]
    if (!nowGame) return await reply(e, `现在没有开局哦,请输入/24点来开始游戏!`, buttons)
    delete GameName[e.group_id]
    return await reply(e, `游戏已结束,参考答案: ${nowGame.answer.replace(/\*/g, 'x').replace(/\//g, '÷')}`, buttons)
  }

  async arithmeticPK(e) {
    const GameName = gameCache['arithmetic']
    const nowGame = GameName[e.group_id]
    if (nowGame) {
      if (nowGame.start) {
        return await reply(e, `算术对战已经开始了哦,请等待结束吧`, buttons)
      }
      const user_id = getUserId(e)
      nowGame.user.push({
        id: nowGame.user[0].id == user_id ? '菜菜' : user_id,
        str: `(1 + ? - ?) x ? ÷ ?`,
        sum: 0,
        ops: { '+': true, '-': true, 'x': true, '÷': true }
      })
      const buttons = [
        [
          { text: '+', callback: '/填入+' },
          { text: '-', callback: '/填入-' },
          { text: '*', callback: '/填入x' },
          { text: '/', callback: '/填入÷' },
        ],
        // [
        //   { text: '认输', callback: '' }
        // ]
      ]
      // 接受挑战
      const rand = Math.floor(Math.random() * 9) + 1
      nowGame.nowNum = rand
      nowGame.start = true
      nowGame.time = setTimeout(() => {
        e.reply('算术对战已超时自动结束游戏')
        delete GameName[e.group_id]
      }, 1000 * 60 * 3)
      return await reply(e, `请<@${nowGame.user[0].id}>开始选择,本次数字:\r${rand}`, buttons)
    }
    GameName[e.group_id] = {
      start: false,
      user: [{
        id: getUserId(e),
        str: `(1 + ? - ?) x ? ÷ ?`,
        sum: 0,
        ops: { '+': true, '-': true, 'x': true, '÷': true }
      }],
      nowUser: 0,
      nowNum: 0,
      count: 0,
      time: false
    }
    const buttons = [
      [
        { text: '接受挑战', callback: '/算术对战' }
      ]
    ]
    return await reply(e, `游戏规则:\r(1 + ? - ?) x ? ÷ ?\r依次给予4个1-9的数字,每次可选择填入其中某个?\r最后计算谁的数字大谁就赢\r想要对战的玩家发送/算术对战 即可加入游戏\r再次发送/算术对战 就是和菜菜挑战哦`, buttons)
  }

  async arithmetic(e) {
    const GameName = gameCache['arithmetic']
    const nowGame = GameName[e.group_id]
    if (!nowGame) {
      return await reply(e, '还没有开始游戏哦', [[{ text: '开始游戏', input: '/算术对战', send: true }]])
    }
    let nowUser = nowGame.user[nowGame.nowUser]
    if (nowUser.id != getUserId(e)) {
      return await reply(e, '现在不是你的回合哦')
    }
    const buttons = [
      [
        { text: '+', callback: '/填入+' },
        { text: '-', callback: '/填入-' },
        { text: '*', callback: '/填入x' },
        { text: '/', callback: '/填入÷' },
      ],
      // [
      //   { text: '认输', callback: '' }
      // ]
    ]
    let target = e.msg.replace(/#?填入\s*/, '')
    target = {
      '+': '+',
      '-': '-',
      'x': 'x',
      '÷': '÷',
      '*': 'x',
      '·': 'x',
      '\\': '÷'
    }[target]
    if (!nowUser.ops[target]) {
      return await reply(e, `${target}已经被填入了,现在的表达式:\r${nowUser.str}`, buttons)
    }
    clearTimeout(nowGame.time)
    nowGame.count++
    nowUser.ops[target] = false
    nowUser.str = nowUser.str.replace(`${target} ?`, `${target} ${nowGame.nowNum}`)
    const rand = Math.floor(Math.random() * 9) + 1
    nowGame.nowNum = rand
    nowGame.time = setTimeout(() => {
      e.reply('算术对战已超时自动结束游戏')
      delete GameName[e.group_id]
    }, 1000 * 60 * 3)
    if (nowGame.count == 4) {
      let str = nowUser.str
      str = str.replace('x', '*').replace('÷', '/')
      let ret = eval(str)
      nowUser.sum = ret % 1 == 0 ? ret : ret.toFixed(2)
      if (nowGame.nowUser == 0) {
        nowGame.nowUser++
      } else {
        const buttons = [
          [
            { text: '再来一局', input: '/算术对战', send: true }
          ]
        ]
        clearTimeout(nowGame.time)
        delete GameName[e.group_id]
        await reply(e, `你的结果为${nowUser.str} = ${nowUser.sum}`)
        const num1 = Number(nowGame.user[0].sum)
        const num2 = Number(nowGame.user[1].sum)
        if (num1 > num2) {
          return await reply(e, `恭喜<@${nowGame.user[0].id}>获得胜利!`, buttons)
        } else if (num1 == num2) {
          return await reply(e, `是平局!`)
        }
        return await reply(e, `恭喜<@${nowGame.user[1].id}>获得胜利!`, buttons)
      }
      let oldUser = nowUser
      nowUser = nowGame.user[1]
      if (nowUser.id == '菜菜') {
        await reply(e, `你的结果为${oldUser.str} = ${oldUser.sum}\r现在轮到菜菜了哦`)
        clearTimeout(nowGame.time)
        for (let i = 0; i < 4; i++) {
          const rand = Math.floor(Math.random() * 9) + 1;
          const arr = ['÷', '-', '+', 'x']
          if (rand > 4) {
            arr.reverse()
          }
          for (const i of arr) {
            if (nowUser.ops[i]) {
              nowUser.str = nowUser.str.replace(`${i} ?`, `${i} ${rand}`)
              nowUser.ops[i] = false
              break
            }
          }
        }
        str = nowUser.str
        str = str.replace('x', '*').replace('÷', '/')
        ret = eval(str)
        nowUser.sum = ret % 1 == 0 ? ret : ret.toFixed(2)
        await sleep(3000)
        await reply(e, `菜菜的结果为${nowUser.str} = ${nowUser.sum}`)
        const buttons = [
          [
            { text: '再来一局', input: '/算术对战', send: true }
          ]
        ]
        delete GameName[e.group_id]
        const num1 = Number(nowGame.user[0].sum)
        const num2 = Number(nowGame.user[1].sum)
        if (num1 > num2) {
          return await reply(e, `恭喜你赢了菜菜!`, buttons)
        } else if (num1 == num2) {
          return await reply(e, `是平局!`, buttons)
        }
        return await reply(e, `是菜菜赢了哦!`, buttons)
      }
      await reply(e, `你的结果为${oldUser.str} = ${oldUser.sum}\r现在轮到<@${nowUser.id}>了`)
      nowGame.count = 0
      return await reply(e, `请<@${nowUser.id}>开始选择,\r现在的表达式:\r${nowUser.str}\r本次数字:\r${rand}`, buttons)
    }
    return await reply(e, `请<@${nowUser.id}>开始选择,\r现在的表达式:\r${nowUser.str}\r本次数字:\r${rand}`, buttons)
  }

}

function reply(e, msg, buttons = []) {
  if (e.bot.adapter.id != 'QQBot') {
    let regex = /(<@.*?>)/;
    let result;

    if (regex.test(msg)) {
      result = msg.split(regex).filter(Boolean);
      result = result.map(item => {
        if (/<@.*?>/.test(item)) {
          let qq = item.match(/<@(.*?)>/)[1];
          return segment.at(qq)
        } else {
          return item;
        }
      });
    } else {
      result = msg;
    }
    return e.reply(result)
  }
  if (!Array.isArray(msg)) {
    msg = [msg]
  }
  const user_id = e.raw.sender?.user_id || e.raw.operator_id
  let index = 1, params = [{
    key: key[0],
    values: [`<@${user_id}>\r`]
  }]
  for (let i of msg) {
    params.push({
      key: key[index],
      values: [i]
    })
    index++
  }
  const md = segment.markdown({
    custom_template_id,
    params
  })
  const msgs = [md]
  if (buttons.length) {
    msgs.push(segment.button(...buttons))
  }
  return e.reply(msgs)
}

function sixty(cards, sum) {
  let bds_list = [];
  let ops = ['+', '-', '*', '/'];
  let permutations = permute(cards);
  permutations.forEach(nums => {
    ops.forEach(op1 => {
      ops.forEach(op2 => {
        ops.forEach(op3 => {
          if (nums.length === 4) {
            let bds1 = `(${nums[0]}${op1}${nums[1]})${op2}(${nums[2]}${op3}${nums[3]})`;
            let bds2 = `((${nums[0]}${op1}${nums[1]})${op2}${nums[2]})${op3}${nums[3]}`;
            let bds3 = `${nums[0]}${op1}(${nums[1]}${op2}(${nums[2]}${op3}${nums[3]}))`;
            [bds1, bds2, bds3].forEach(bds => {
              try {
                if (Math.abs(eval(bds) - sum) < 1e-10) {
                  bds_list.push(bds);
                }
              } catch (e) {
                console.log(e);
              }
            });
          } else {
            ops.forEach(op4 => {
              let bds1 = `(((${nums[0]}${op1}${nums[1]})${op2}${nums[2]})${op3}${nums[3]})${op4}${nums[4]}`;
              let bds2 = `(${nums[0]}${op1}(${nums[1]}${op2}(${nums[2]}${op3}(${nums[3]}${op4}${nums[4]}))))`;
              let bds3 = `(${nums[0]}${op1}(${nums[1]}${op2}(${nums[2]}${op3}${nums[3]})))${op4}${nums[4]}`;
              let bds4 = `(${nums[0]}${op1}((${nums[1]}${op2}${nums[2]})${op3}${nums[3]}))${op4}${nums[4]}`;
              [bds1, bds2, bds3, bds4].forEach(bds => {
                try {
                  if (Math.abs(eval(bds) - sum) < 1e-10) {
                    bds_list.push(bds);
                  }
                } catch (e) {
                  console.log(e);
                }
              });
            });
          }
        });
      });
    });
  });
  if (bds_list.length > 0 && (sum == 24 ? bds_list.length < 30 : true)) {
    // if (bds_list.length > 0) {
    return bds_list[Math.floor(Math.random() * bds_list.length)];
  } else {
    return false;
  }
}

function random_question(sum) {
  sum = Number(sum)
  const count = {
    24: 4,
    60: 5,
    72: 5
  }[sum]
  while (true) {
    const cards = []
    for (let i = 0; i < count; i++) {
      cards.push(Math.floor(Math.random() * 9) + 1)
    }
    let able = sixty(cards, sum);
    if (able) {
      return [cards, able];
    }
  }
}

function check_result(submit, question, sum) {
  try {
    if (!/[a-zA-Z]/.test(submit) && eval(submit) === Number(sum)) {
      let num = submit.replace(/[+\-*/()]/g, ',').split(',');
      for (let i = 0; i < question.length; i++) {
        if (num.includes(question[i].toString())) {
          num.splice(num.indexOf(question[i].toString()), 1);
        }
      }
      num = num.filter(item => item !== '');
      if (num.length === 0) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

function permute(input) {
  let permArr = [],
    usedChars = [];
  function main(input) {
    let i, ch;
    for (i = 0; i < input.length; i++) {
      ch = input.splice(i, 1)[0];
      usedChars.push(ch);
      if (input.length === 0) {
        permArr.push(usedChars.slice());
      }
      main(input);
      input.splice(i, 0, ch);
      usedChars.pop();
    }
    return permArr
  }
  return main(input);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getUserId(e) {
  if (e.bot.adapter.id != 'QQBot') {
    return e.user_id
  }
  return e.raw.sender?.user_id || e.raw.operator_id
}