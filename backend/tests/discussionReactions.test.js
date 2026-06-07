const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  ALLOWED_EMOJI,
  reactionsForClient,
  toggleReaction
} = require('../src/lib/discussionReactions')

describe('discussionReactions', () => {
  it('reactionsForClient ignore emoji non autorisés', () => {
    const json = JSON.stringify({ '👍': [1, 2], '🔥': [3] })
    const list = reactionsForClient(json)
    assert.equal(list.length, 1)
    assert.equal(list[0].emoji, '👍')
    assert.equal(list[0].count, 2)
  })

  it('toggleReaction ajoute puis retire une réaction', () => {
    let json = null
    json = toggleReaction(json, 5, '❤️')
    assert.deepEqual(JSON.parse(json), { '❤️': [5] })
    json = toggleReaction(json, 5, '❤️')
    assert.deepEqual(JSON.parse(json), {})
  })

  it('toggleReaction rejette emoji invalide', () => {
    assert.throws(() => toggleReaction(null, 1, '🔥'), /non autorisée/)
  })

  it('ALLOWED_EMOJI contient 6 réactions', () => {
    assert.equal(ALLOWED_EMOJI.length, 6)
  })
})
