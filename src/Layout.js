import React, { Component } from 'react'
import Sidebar from './Sidebar'
import Projection from './Projection'
import About from './About'
import Imprint from './Imprint'
import Privacy from './Privacy'
import * as _ from 'lodash'

// padding constructor
function p(tb, lr) {
  return `${tb}px ${lr}px`
}

class Layout extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ww: null,
      wh: null,
      sidebar_height: null,
      hover_index: null,
      show_about: null,
      show_imprint: null,
      show_privacy: null,
      algorithm_choice: 0,
      label_choice:0,
    }
    this.sidebar_ctx = null
    this.setSize = _.debounce(this.setSize.bind(this), 200)
    this.checkHash = this.checkHash.bind(this)
    this.setSidebarCanvas = this.setSidebarCanvas.bind(this)
    this.toggleAbout = this.toggleAbout.bind(this)
    this.toggleImprint = this.toggleImprint.bind(this)
    this.togglePrivacy = this.togglePrivacy.bind(this)
    this.selectAlgorithm = this.selectAlgorithm.bind(this)
    this.selectLabel = this.selectLabel.bind(this)
  }

  selectAlgorithm(v) {
    let i = this.props.algorithm_options.indexOf(v)
    this.setState({ algorithm_choice: i })
  }
  selectLabel(v) {
    let i = this.props.label_options.indexOf(v)
    this.setState({ label_choice: i })
  }

  setSize() {
    this.setState({ ww: window.innerWidth, wh: window.innerHeight })
    let sidebar_height = this.sidebar_mount.offsetHeight
    this.setState({ sidebar_height: sidebar_height })
    if (this.sidebar_ctx) this.sidebar_ctx.imageSmoothingEnabled = false
  }

  setSidebarCanvas(canvas) {
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    this.sidebar_ctx = ctx
  }


  toggleAbout(state) {
    if (state === true) {
      window.history.pushState(null, 'About', '#about')
      this.setState({ show_about: true })
    } else if (state === false) {
      window.history.pushState(null, ' ', window.location.pathname)
      this.setState({ show_about: false })
    }
  }

  toggleImprint(state) {
    if (state === true) {
      window.history.pushState(null, 'Imprint', '#impressum')
      this.setState({ show_imprint: true })
    } else if (state === false) {
      window.history.pushState(null, ' ', window.location.pathname)
      this.setState({ show_imprint: false })
    }
  }

  togglePrivacy(state) {
    if (state === true) {
      window.history.pushState(null, 'Privacy', '#datenschutzerklaerung')
      this.setState({ show_privacy: true })
    } else if (state === false) {
      window.history.pushState(null, ' ', window.location.pathname)
      this.setState({ show_privacy: false })
    }
  }

  setHoverIndex(hover_index) {
    this.setState({ hover_index: hover_index })
  }

  componentWillMount() {
    this.setSize()
    this.checkHash()
  }

  checkHash() {
    if (window.location.hash && window.location.hash === '#about') {
      this.setState({ show_about: true })
    } else {
      this.setState({ show_about: false })
    }

    if (window.location.hash && window.location.hash === '#datenschutzerklaerung') {
      this.setState({ show_privacy: true })
    } else {
      this.setState({ show_privacy: false })
    }

    if (window.location.hash && window.location.hash === '#impressum') {
      this.setState({ show_imprint: true })
    } else {
      this.setState({ show_imprint: false })
    }
  }


  componentDidMount() {
    window.addEventListener('resize', this.setSize)
    window.addEventListener('popstate', this.checkHash)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize)
  }

  render() {
    let {
      embeddings,
      embedding_stack,
      labels,
      label_stack,
      algorithm_options,
      label_options,
      color_array,
      color_array_stack,
      colored_images,
      description,
      description_stack,
      sprite_side,
      sprite_side_x,
      sprite_side_y,
      sprite_size,
      sprite_number,
      sprite_image_size,
      sprite_image_width,
      sprite_image_height,
      sprite_actual_size,
      sprite_ratio,
      zoom_min,
      zoom_mid,
      zoom_max,
      hoover_size,
    } = this.props
    let {
      ww,
      wh,
      sidebar_height,
      hover_index,
      show_about,
      show_imprint,
      show_privacy,
      algorithm_choice,
      label_choice,
    } = this.state
    let sidebar_ctx = this.sidebar_ctx


    let line_height = 1.5

    let sidebar_style = {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100vh',
      overflow: 'auto',
      background: '#222',
      display: 'flex',
      flexDirection: 'column',
    }
    let main_style = {
      position: 'relative',
      height: '100vh',
      background: '#111',
      overflow: 'hidden',
    }

    let sidebar_image_size_width, sidebar_image_size_height, sidebar_orientation
    let font_size = 16
    if (ww < 800) {
      font_size = 14
      sidebar_style = {
        ...sidebar_style,
        flexDirection: 'row',
        width: '100%',
        top: 'auto',
        height: 'auto',
        bottom: 0,
      }
      main_style = { width: ww, height: wh - sidebar_height }
      sidebar_image_size_height = font_size * line_height * 3
      sidebar_image_size_width = sidebar_image_size_height * this.props.sprite_ratio
      sidebar_orientation = 'horizontal'
    } else if (ww < 800 + 600) {
      let scaler = 200 + (300 - 200) * ((ww - 800) / 600)
      font_size = 14 + 2 * ((ww - 800) / 600)
      sidebar_style = {
        ...sidebar_style,
        width: scaler,
      }
      sidebar_image_size_width = sidebar_style.width
      sidebar_image_size_height = sidebar_image_size_width / this.props.sprite_ratio
      main_style = {
        ...main_style,
        width: ww - scaler,
        left: scaler,
        height: wh,
      }
      sidebar_orientation = 'vertical'
    } else {
      sidebar_style = {
        ...sidebar_style,
        width: 300,
      }
      main_style = {
        ...main_style,
        width: ww - 300,
        left: 300,
        height: wh,
      }
      sidebar_image_size_width = sidebar_style.width
      sidebar_image_size_height = sidebar_image_size_width / this.props.sprite_ratio
      sidebar_orientation = 'vertical'
    }

    let grem = font_size * line_height

    let general_style = {
      fontSize: font_size,
      lineHeight: line_height,
    }

    return ww !== null ? (
      <div style={general_style}>
        <div
          style={sidebar_style}
          ref={sidebar_mount => {
            this.sidebar_mount = sidebar_mount
          }}
        >
          <Sidebar
            sidebar_orientation={sidebar_orientation}
            sidebar_image_size_width={sidebar_image_size_width}
            sidebar_image_size_height={sidebar_image_size_height}
            grem={grem}
            p={p}
            color_array={color_array}
            color_array_stack={color_array_stack}
            colored_images={colored_images}
            description = {description}
            description_stack = {description_stack}
            setSidebarCanvas={this.setSidebarCanvas}
            hover_index={hover_index}
            labels={labels}
            label_stack={label_stack}
            toggleAbout={this.toggleAbout}
            togglePrivacy={this.togglePrivacy}
            toggleImprint={this.toggleImprint}
            algorithm_options={algorithm_options}
            algorithm_choice={algorithm_choice}
            selectAlgorithm={this.selectAlgorithm}
            label_options={label_options}
            label_choice={label_choice}
            selectLabel={this.selectLabel}
          />
        </div>
        <div style={main_style}>
          <Projection
            width={main_style.width}
            height={main_style.height}
            embeddings={embeddings}
            embedding_stack = {embedding_stack}
            sprite_side= {sprite_side}
            sprite_side_x= {sprite_side_x}
            sprite_side_y= {sprite_side_y}
            sprite_size= {sprite_size}
            sprite_number= {sprite_number}
            sprite_image_size= {sprite_image_size}
            sprite_image_width= {sprite_image_width}
            sprite_image_height= {sprite_image_height}
            sprite_actual_size= {sprite_actual_size}
            sprite_ratio = {sprite_ratio}
            zoom_min = {zoom_min}
            zoom_mid = {zoom_mid}
            zoom_max = {zoom_max}
            hoover_size = {hoover_size}
            labels={labels}
            label_stack={label_stack}
            color_array={color_array}
            color_array_stack={color_array_stack}
            colored_images={colored_images}
            description={description}
            description_stack={description_stack}
            sidebar_ctx={sidebar_ctx}
            sidebar_image_size_width={sidebar_image_size_width}
            sidebar_image_size_height={sidebar_image_size_height}
            setHoverIndex={this.setHoverIndex.bind(this)}
            algorithm_choice={algorithm_choice}
            label_choice={label_choice}
          />
        </div>
        {show_about ? (
          <About grem={grem} p={p} toggleAbout={this.toggleAbout} />
        ) : null}
        {show_imprint ? (
          <Imprint grem={grem} p={p} toggleImprint={this.toggleImprint} />
        ) : null}
        {show_privacy ? (
          <Privacy grem={grem} p={p} togglePrivacy={this.togglePrivacy} />
        ) : null}
      </div>
    ) : (
      <div style={{ padding: '1rem' }}>Loading layout...</div>
    )
  }
}

export default Layout
