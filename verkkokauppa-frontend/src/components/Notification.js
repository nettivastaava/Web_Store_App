import React from 'react'

const Notification = ({message}) => {

  if (message === '') {
    return null
  } else if (message.match('^Added') || message.match('^Your purchase was successful') || message.match('^Password updated')) {
    return <div className='addProd'>{message}</div>
  } else if (message.match('^Removed') || message.match('^Make') || message.match('^Invalid')) {
      return <div className='removeProd'>{message}</div>
  } else {
      return <div className='removeProd'>{message}</div>
  }
}

export default Notification