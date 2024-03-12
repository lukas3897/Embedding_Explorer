import React, { Component } from 'react'
import Markdown from 'react-remarkable'
import { privacy_text } from './Content'

class Privacy extends Component {
  render() {
    let { grem, p } = this.props
    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          background: '#222',
          color: '#fff',
          paddingTop: grem * 2,
          overflowY: 'auto',
          fontSize: 16,
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            background: '#333',
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            padding: grem / 2,
          }}
        >
          Privacy
          <button
            onClick={() => {
              this.props.togglePrivacy(false)
            }}
            className="hover-555"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: grem * 2,
              width: grem * 2,
              padding: grem / 2,
              textAlign: 'center',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            &times;
          </button>
        </div>
        <div
          style={{
            maxWidth: grem * 30,
            margin: '0 auto',
            padding: grem / 2,
            color: '#fff',
          }}
        >
          <Markdown>{privacy_text}</Markdown>
        </div>
      </div>
    )
  }
}

export default Privacy
