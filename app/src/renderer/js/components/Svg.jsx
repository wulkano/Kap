import {readFile} from 'fs'
import {resolve as resolvePath, join as joinPath} from 'path'

import React from 'react'
import Component from './Component'

class Svg extends Component {
  componentDidMount() {
    const filePath = resolvePath(joinPath(__dirname, 'static', `${this.props.name}.svg`))
    console.log(filePath)
    readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        throw err
      }
      console.log(data)
      this.setState({data})
    })
  }

  render() {
    console.log(this.state)
    if (this.state && this.state.data) {
      // eslint-disable-next-line react/no-danger
      return <div dangerouslySetInnerHTML={{__html: this.state.data}}/>
    }
    return null
  }
}

Svg.propTypes = {
  name: React.PropTypes.string.isRequired
}

export default Svg
