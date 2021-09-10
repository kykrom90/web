import { crypto } from '@shapeshiftoss/hdwallet-native'
const { EncryptedWallet } = crypto
import { useCallback, useEffect, useMemo, useState } from 'react'

export const useRevocableSeed = (encryptedWallet?: EncryptedWallet) => {
  const [generating, setIsGenerating] = useState(true)

  const revocableSeed = useMemo(
    () =>
      Proxy.revocable({} as { seed?: string }, {
        get: (target, name) => (name === 'seed' ? target.seed : undefined),
        set: (target, name, value) => {
          if (name === 'seed') {
            Object.defineProperty(target, name, {
              enumerable: false,
              configurable: false,
              writable: false,
              value
            })

            return true
          }
          return false
        }
      }),
    []
  )

  const generate = useCallback(async () => {
    setIsGenerating(true)
    if (encryptedWallet && !encryptedWallet.encryptedWallet) {
      try {
        await encryptedWallet.createWallet()
        revocableSeed.proxy.seed = await encryptedWallet.decrypt()
      } catch (error) {
        console.error('Error creating wallet', error)
      }
      setIsGenerating(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryptedWallet?.encryptedWallet, revocableSeed])

  useEffect(() => {
    generate()
  }, [generate])

  return { revocableSeed, loading: generating }
}
