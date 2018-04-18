import Head from 'next/head';
import React from 'react'
import {ipcRenderer} from 'electron';


export default class extends React.Component {
  render() {
    return (
      <div>
        <span>This is the editor</span>
      </div>
    )
  }
}
