import { Asset, NetworkTypes } from '@shapeshiftoss/asset-service'
import { FeeData, FeeDataKey } from '@shapeshiftoss/chain-adapters'
import { AnimatePresence } from 'framer-motion'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  useHistory,
  useLocation
} from 'react-router-dom'
import { AssetMarketData, useGetAssetData } from 'hooks/useAsset/useAsset'

import { SelectAssets } from '../../SelectAssets/SelectAssets'
import { useFormSend } from './hooks/useFormSend/useFormSend'
import { SendRoutes } from './Send'
import { Address } from './views/Address'
import { Confirm } from './views/Confirm'
import { Details } from './views/Details'
import { QrCodeScanner } from './views/QrCodeScanner'

export enum SendFormFields {
  Address = 'address',
  Asset = 'asset',
  FeeType = 'feeType',
  EstimatedFees = 'estimatedFees',
  Crypto = 'crypto',
  CryptoAmount = 'crypto.amount',
  CryptoSymbol = 'crypto.symbol',
  FiatAmount = 'fiat.amount',
  Fiat = 'fiat',
  FiatSymbol = 'fiat.symbol',
  Transaction = 'transaction'
}

export type SendInput = {
  [SendFormFields.Address]: string
  [SendFormFields.Asset]: AssetMarketData
  [SendFormFields.FeeType]: FeeDataKey
  [SendFormFields.EstimatedFees]: FeeData
  [SendFormFields.Crypto]: {
    amount: string
    symbol: string
  }
  [SendFormFields.Fiat]: {
    amount: string
    symbol: string
  }
  [SendFormFields.Transaction]: unknown
}

type SendFormProps = {
  asset: AssetMarketData
}

export const Form = ({ asset: initalAsset }: SendFormProps) => {
  const location = useLocation()
  const history = useHistory()
  const { handleSend } = useFormSend()
  const getAssetData = useGetAssetData()

  const methods = useForm<SendInput>({
    mode: 'onChange',
    defaultValues: {
      address: '',
      asset: initalAsset,
      feeType: FeeDataKey.Average,
      crypto: {
        amount: '',
        symbol: initalAsset?.symbol
      },
      fiat: {
        amount: '',
        symbol: 'USD' // TODO: localize currency
      }
    }
  })

  const handleAssetSelect = async (asset: Asset) => {
    const assetMarketData = await getAssetData({
      chain: asset.chain,
      network: NetworkTypes.MAINNET,
      tokenId: asset.tokenId
    })

    methods.setValue(SendFormFields.Asset, assetMarketData)
    methods.setValue(SendFormFields.Crypto, { symbol: asset.symbol, amount: '' })
    methods.setValue(SendFormFields.Fiat, { symbol: 'USD', amount: '' })

    history.push(SendRoutes.Address)
  }

  const checkKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter') event.preventDefault()
  }

  return (
    <FormProvider {...methods}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form onSubmit={methods.handleSubmit(handleSend)} onKeyDown={checkKeyDown}>
        <AnimatePresence exitBeforeEnter initial={false}>
          <Switch location={location} key={location.key}>
            <Route
              path={SendRoutes.Select}
              component={(props: RouteComponentProps) => (
                <SelectAssets onClick={handleAssetSelect} {...props} />
              )}
            />
            <Route path={SendRoutes.Address} component={Address} />
            <Route path={SendRoutes.Details} component={Details} />
            <Route path={SendRoutes.Scan} component={QrCodeScanner} />
            <Route path={SendRoutes.Confirm} component={Confirm} />
            <Redirect exact from='/' to={SendRoutes.Select} />
          </Switch>
        </AnimatePresence>
      </form>
    </FormProvider>
  )
}
