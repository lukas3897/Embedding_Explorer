import React, { Component } from 'react'
import * as THREE from 'three'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as TWEEN from '@tweenjs/tween.js'

let tile_string = 'tile_image_'

class Projection extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.init = this.init.bind(this)
    this.addPoints = this.addPoints.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.setUpCamera = this.setUpCamera.bind(this)
    this.animate = this.animate.bind(this)
    this.getScaleFromZ = this.getScaleFromZ.bind(this)
    this.getZFromScale = this.getZFromScale.bind(this)
    this.changeEmbeddings = this.changeEmbeddings.bind(this)
    this.changeLabels = this.changeLabels.bind(this)
    this.tile_locations = [...Array(this.props.sprite_number)].map(
      (n, i) => `${process.env.PUBLIC_URL}/${tile_string}${i}.png`
    )
    this._images = this.tile_locations.map(src => {
      let img = document.createElement('img')
      img.src = src
      return img
    })
    this.scale1 = d3
      .scaleLinear()
      .domain([20, 3])
      .range([this.props.zoom_min, this.props.zoom_mid])
      .clamp(true)
    this.scale2 = d3
      .scaleLinear()
      .domain([3, 0])
      .range([this.props.zoom_mid, this.props.zoom_max])
  }

  changeEmbeddings(prev_choice, new_choice) {
    // assumes mnist embeddings has been updated
    let ranges = []
    for (let i = 0; i < this.props.sprite_number; i++) {
      let start = i * this.props.sprite_size
      let end = (i + 1) * this.props.sprite_size
      if (i === this.props.sprite_number - 1) end = this.props.sprite_number * this.props.sprite_size
      ranges.push([start, end])
    }

    let embedding_chunks = ranges.map(range =>
      this.props.embedding_stack[new_choice].slice(
        range[0],
        range[1]
      )
    )

    for (let c = 0; c < this.props.sprite_number; c++) {
      let echunk = embedding_chunks[c]

      let points = this.scene.children[0].children[c]
      let numVertices = echunk.length
      let position = points.geometry.attributes.position.array
      let target = new Float32Array(numVertices * 3)
      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let x = echunk[i][0]
        let y = echunk[i][1]
        let z = 0
        target[index] = x
        target[index + 1] = y
        target[index + 2] = z
      }


      let tween = new TWEEN.Tween(position)
        .to(target, 1000)
        .easing(TWEEN.Easing.Linear.None)
      tween.onUpdate(function() {
        points.geometry.attributes.position = new THREE.BufferAttribute(
          position,
          3
        )
        points.geometry.attributes.position.needsUpdate = true // required after the first render
        points.geometry.computeBoundingSphere()
      })
      tween.start()
    }

  }

  changeLabels(new_choice) {
    // assumes mnist embeddings has been updated
    let color_array = this.props.color_array_stack[new_choice]
    let ranges = []
    for (let i = 0; i < this.props.sprite_number; i++) {
      let start = i * this.props.sprite_size
      let end = (i + 1) * this.props.sprite_size
      if (i === this.props.sprite_number - 1) end = this.props.sprite_number * this.props.sprite_size
      ranges.push([start, end])
    }

    let label_chunks = ranges.map(range =>
      this.props.label_stack[new_choice].slice(
        range[0],
        range[1]
      )
    )

    for (let c = 0; c < this.props.sprite_number; c++) {
      let points = this.scene.children[0].children[c]
      let lchunk = label_chunks[c]
      let numVertices = lchunk.length
      let color_o = points.geometry.attributes.color.array
      let colors = new Float32Array(numVertices * 3)

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let color = color_array[lchunk[i]]
        colors[index] = color[0] / 255
        colors[index + 1] = color[1] / 255
        colors[index + 2] = color[2] / 255
      }

      let tween = new TWEEN.Tween(color_o)
        .to(colors, 1000)
        .easing(TWEEN.Easing.Linear.None)
      tween.onUpdate(function() {
        points.geometry.attributes.color = new THREE.BufferAttribute(color_o, 3)
        points.geometry.attributes.color.needsUpdate = true // required after the first render
        points.geometry.computeBoundingSphere()
      })
      tween.start()
    }
  }

  getZFromScale(scale) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov)
    let scale_height = this.props.height / scale
    let camera_z_position = scale_height / (2 * Math.tan(rvFOV / 2))
    return camera_z_position
  }

  getScaleFromZ(camera_z_position) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov)
    let half_fov_height = Math.tan(rvFOV / 2) * camera_z_position
    let fov_height = half_fov_height * 2
    let scale = this.props.height / fov_height
    return scale
  }

  handleResize = (width, height) => {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    let current_scale = this.getScaleFromZ(this.camera.position.z)
    let d3_x = -(this.camera.position.x * current_scale) + this.props.width / 2
    let d3_y = this.camera.position.y * current_scale + this.props.height / 2
    var resize_transform = d3.zoomIdentity
      .translate(d3_x, d3_y)
      .scale(current_scale)
    let view = d3.select(this.mount)
    this.d3_zoom.transform(view, resize_transform)
  }

  zoomHandler() {
    let d3_transform = d3.event.transform

    let scale = d3_transform.k
    let x = -(d3_transform.x - this.props.width / 2) / scale
    let y = (d3_transform.y - this.props.height / 2) / scale
    let z = this.getZFromScale(scale)

    this.camera.position.set(x, y, z)

    // point size scales at end of zoom

    let zoomScaler = input => {
      if (input >= 3) {
        return this.scale1(input)
      } else  {
        return this.scale2(input)
      }
    }
    let new_size = zoomScaler(z)
    let point_group = this.scene.children[0].children
    for (let c = 0; c < point_group.length; c++) {
      point_group[c].material.uniforms.size.value = new_size
    }
  }

  setUpCamera() {
    let { width, height, embeddings } = this.props

    let aspect = this.camera.aspect
    let vFOV = this.camera.fov
    let rvFOV = THREE.Math.degToRad(vFOV)

    let xs = embeddings.map(e => e[0])
    let min_x = _.min(xs)
    let max_x = _.max(xs)
    let ys = embeddings.map(e => e[1])
    let min_y = _.min(ys)
    let max_y = _.max(ys)
    let data_width = max_x - min_x
    let data_height = max_y - min_y
    let data_aspect = data_width / data_height

    let max_x_from_center = _.max([min_x, max_x].map(m => Math.abs(m)))
    let max_y_from_center = _.max([min_y, max_y].map(m => Math.abs(m)))

    let max_center = Math.max(max_x_from_center, max_y_from_center)

    let camera_z_start
    if (data_aspect > aspect) {
      // console.log("width is limiter");
      // camera_z_start = max_x_from_center / Math.tan(rvFOV / 2) / aspect
    } else {
      // console.log("height is limiter");
      // camera_z_start = max_y_from_center / Math.tan(rvFOV / 2)
    }

    camera_z_start = max_center / Math.tan(rvFOV / 2)

    let far = camera_z_start * 1.25
    this.camera.far = far
    this.camera.position.z = camera_z_start * 1.1

    // set up zoom
    this.d3_zoom = d3
      .zoom()
      .scaleExtent([this.getScaleFromZ(far - 1), this.getScaleFromZ(0.1)])
      .on('zoom', this.zoomHandler.bind(this))

    let view = d3.select(this.mount)
    this.view = view
    view.call(this.d3_zoom)
    let initial_scale = this.getScaleFromZ(this.camera.position.z)
    var initial_transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initial_scale)
    this.d3_zoom.transform(view, initial_transform)
  }

  addPoints() {
    let { embeddings, labels, color_array } = this.props
    

    // split embeddings and labels into chunks to match sprites
    let ranges = []
    for (let i = 0; i < this.props.sprite_number; i++) {
      let start = i * this.props.sprite_size
      let end = (i + 1) * this.props.sprite_size
      if (i === this.props.sprite_number - 1) end = this.props.sprite_number * this.props.sprite_size
      ranges.push([start, end])
    }
    let embedding_chunks = ranges.map(range =>
      embeddings.slice(range[0], range[1])
    )
    let label_chunks = ranges.map(range =>
      labels.slice(range[0], range[1])
    )

    // load the textures
    let loader = new THREE.TextureLoader()
    this.textures = this.tile_locations.map(l => {
      let t = loader.load(l)
      t.flipY = false
      t.magFilter = THREE.NearestFilter
      // t.minFilter = THREE.LinearMipMapLinearFilter;
      return t
    })

    let point_group = new THREE.Group()
    for (let c = 0; c < this.props.sprite_number; c++) {
      let echunk = embedding_chunks[c]
      let lchunk = label_chunks[c]

      let vertices = []
      for (let v = 0; v < echunk.length; v++) {
        let embedding = echunk[v]
        let vert = new THREE.Vector3(embedding[0], embedding[1], 0)
        vertices[v] = vert
      }

      let geometry = new THREE.BufferGeometry()

      let numVertices = vertices.length
      let positions = new Float32Array(numVertices * 3)
      let offsets = new Float32Array(numVertices * 2)
      let colors = new Float32Array(numVertices * 3)
      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))
      geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let x = echunk[i][0]
        let y = echunk[i][1]
        let z = 0
        positions[index] = x
        positions[index + 1] = y
        positions[index + 2] = z
      }

      // geometry.attributes.position.copyVector3sArray(vertices)

      let texture_subsize_x = 1 / this.props.sprite_side_x
      let texture_subsize_y = 1 / this.props.sprite_side_y

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 2) {
        let x = ((i % this.props.sprite_side_x) * this.props.sprite_image_width) / this.props.sprite_actual_size
        let y =
          (Math.floor(i / this.props.sprite_side_y) * this.props.sprite_image_height) / this.props.sprite_actual_size
        offsets[index] = x
        offsets[index + 1] = y
      }

      
      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let color = color_array[lchunk[i]]
        colors[index] = color[0] / 255
        colors[index + 1] = color[1] / 255
        colors[index + 2] = color[2] / 255
      }
      let point_size = Math.max(this.props.sprite_image_width,this.props.sprite_image_height)
      // uniforms
      let uniforms = {
        texture: { value: this.textures[c] },
        repeat: { value: new THREE.Vector2(texture_subsize_x, texture_subsize_y) },
        size: { value:  point_size},
        height: {value: this.props.sprite_image_height},
        width: {value: this.props.sprite_image_width},
      }

      let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float size;
        void main() {
          vOffset = offset;
          vColor = color;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`
      let fragment_shader
      if (this.props.colored_images == 0){
        fragment_shader = `
          uniform sampler2D texture;
          uniform vec2 repeat;
          uniform float height;
          uniform float width;
          varying vec2 vOffset;
          varying vec3 vColor;
          void main() {
            if (width>height){
              float height_rel = height/width;
              float start_rel = (width-height)/(2.0*width);
              float end_rel = start_rel+height_rel;
              if (gl_PointCoord.y>=start_rel && gl_PointCoord.y<=end_rel) {
                float y_new = ((gl_PointCoord.y-start_rel)/height_rel);
                vec2 uv = vec2( gl_PointCoord.x, y_new );
                vec4 tex = texture2D( texture, uv * repeat + vOffset );
                if ( tex.r < 0.05 ) discard;
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex * vec4(vColor, 1.0);
              } else {
                discard;
              }
            } else if (width<height) {
              float width_rel = width/height;
              float start_rel = (height-width)/(2.0*height);
              float end_rel = start_rel+width_rel;
              if (gl_PointCoord.x>=start_rel && gl_PointCoord.x<=end_rel) {
                float x_new = ((gl_PointCoord.x-start_rel)/width_rel);
                vec2 uv = vec2( x_new,gl_PointCoord.y );
                vec4 tex = texture2D( texture, uv * repeat + vOffset );
                if ( tex.r < 0.05 ) discard;
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex * vec4(vColor, 1.0);
              } else {
                discard;
              }
            } else {
              vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              if ( tex.r < 0.5) discard;
              tex.r = 1.0;
              tex.g = 1.0;
              tex.b = 1.0;
              gl_FragColor = tex * vec4(vColor, 1.0); 
            }
          }`
      }else if (this.props.colored_images == -1){
        fragment_shader = `
          uniform sampler2D texture;
          uniform vec2 repeat;
          uniform float height;
          uniform float width;
          varying vec2 vOffset;
          varying vec3 vColor;
          void main() {
            if (width>height){
              float height_rel = height/width;
              float start_rel = (width-height)/(2.0*width);
              float end_rel = start_rel+height_rel;
              if (gl_PointCoord.y>=start_rel && gl_PointCoord.y<=end_rel) {
                float y_new = ((gl_PointCoord.y-start_rel)/height_rel);
                vec2 uv = vec2( gl_PointCoord.x, y_new );
                vec4 tex = texture2D( texture, uv * repeat + vOffset );
                if ( tex.r < 0.05 ) discard;
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex * vec4(vColor, 1.0);
              } else {
                discard;
              }
            } else if (width<height) {
              float width_rel = width/height;
              float start_rel = (height-width)/(2.0*height);
              float end_rel = start_rel+width_rel;
              if (gl_PointCoord.x>=start_rel && gl_PointCoord.x<=end_rel) {
                float x_new = ((gl_PointCoord.x-start_rel)/width_rel);
                vec2 uv = vec2( x_new,gl_PointCoord.y );
                vec4 tex = texture2D( texture, uv * repeat + vOffset );
                if ( tex.r < 0.05 ) discard;
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex * vec4(vColor, 1.0);
              } else {
                discard;
              }
            } else {
              vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              if ( tex.b < 0.5 && tex.r==0.0) discard;
              if (tex.r>0.0){
                tex.r = tex.r;
                tex.g = 0.0;
                tex.b = 0.0;
                gl_FragColor = tex; 
              }
              else{
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex * vec4(vColor, 1.0); 
              }
            }
          }`
      }else{
        fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        uniform float height;
        uniform float width;
        varying vec2 vOffset;
        varying vec3 vColor;
        void main() {
          if (width>height){
            float height_rel = height/width;
            float start_rel = (width-height)/(2.0*width);
            float end_rel = start_rel+height_rel;
            if (gl_PointCoord.y>=start_rel && gl_PointCoord.y<=end_rel) {
              float y_new = ((gl_PointCoord.y-start_rel)/height_rel);
              vec2 uv = vec2( gl_PointCoord.x, y_new );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              gl_FragColor = tex;
            } else {
              discard;
            }
          } else if (width<height) {
            float width_rel = width/height;
            float start_rel = (height-width)/(2.0*height);
            float end_rel = start_rel+width_rel;
            if (gl_PointCoord.x>=start_rel && gl_PointCoord.x<=end_rel) {
              float x_new = ((gl_PointCoord.x-start_rel)/width_rel);
              vec2 uv = vec2( x_new, gl_PointCoord.y );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              gl_FragColor = tex;
            } else {
              discard;
            }
          } else {
            vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
            vec4 tex = texture2D( texture, uv * repeat + vOffset );
            gl_FragColor = tex;
          }
        }`
      }

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
      })

      // point cloud
      let point_cloud = new THREE.Points(geometry, material)
      point_cloud.userData = { sprite_index: c }

      point_group.add(point_cloud)
    }

    this.scene.add(point_group)
  }

  addBlankHighlightPoints() {
    let hover_container = new THREE.Group()
    this.scene.add(hover_container)

    let vert = new THREE.Vector3(0, 0, 0)
    let vertices = [vert]
    let geometry = new THREE.BufferGeometry()
    let numVertices = vertices.length
    var positions = new Float32Array(numVertices * 3) // 3 coordinates per point
    var offsets = new Float32Array(numVertices * 2) // 2 coordinates per point
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))

    // all the attributes will be filled on hover
    let texture_subsize_x = 1 / this.props.sprite_side_x
    let texture_subsize_y = 1 / this.props.sprite_side_y

    let point_size = this.props.hoover_size//Math.max(this.props.sprite_image_width,this.props.sprite_image_height)
    // uniforms
    let uniforms = {
      texture: { value: this.textures[0] },
      repeat: { value: new THREE.Vector2(texture_subsize_x, texture_subsize_y) },
      size: { value:  point_size},
      height: {value: this.props.sprite_image_height},
      width: {value: this.props.sprite_image_width},
    }

    let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        uniform float size;
        void main() {
          vOffset = offset;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

      let fragment_shader
      if (this.props.colored_images == 0){
        fragment_shader = `
          uniform sampler2D texture;
          uniform vec2 repeat;
          uniform float height;
          uniform float width;
          varying vec2 vOffset;
          varying vec3 vColor;
          void main() {
            if (width>height){
              float height_rel = height/width;
              float start_rel = (width-height)/(2.0*width);
              float end_rel = start_rel+height_rel;
              if (gl_PointCoord.y>=start_rel && gl_PointCoord.y<=end_rel) {
                float y_new = ((gl_PointCoord.y-start_rel)/height_rel);
                vec2 uv = vec2( gl_PointCoord.x, y_new );
                vec4 tex = texture2D( texture, uv * repeat + vOffset );
                tex.a = tex.r;
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex;
              } else {
                discard;
              }
            } else if (width<height) {
              float width_rel = width/height;
              float start_rel = (height-width)/(2.0*height);
              float end_rel = start_rel+width_rel;
              if (gl_PointCoord.x>=start_rel && gl_PointCoord.x<=end_rel) {
                float x_new = ((gl_PointCoord.x-start_rel)/width_rel);
                vec2 uv = vec2( x_new,gl_PointCoord.y );
                vec4 tex = texture2D( texture, uv * repeat + vOffset );
                tex.a = tex.r;
                tex.r = 1.0;
                tex.g = 1.0;
                tex.b = 1.0;
                gl_FragColor = tex; 
              } else {
                discard;
              }
            } else {
              vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              tex.a = tex.r;
              tex.r = 1.0;
              tex.g = 1.0;
              tex.b = 1.0;
              gl_FragColor = tex; 
            }
          }`
      }else{
        fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        uniform float height;
        uniform float width;
        varying vec2 vOffset;
        varying vec3 vColor;
        void main() {
          if (width>height){
            float height_rel = height/width;
            float start_rel = (width-height)/(2.0*width);
            float end_rel = start_rel+height_rel;
            if (gl_PointCoord.y>=start_rel && gl_PointCoord.y<=end_rel) {
              float y_new = ((gl_PointCoord.y-start_rel)/height_rel);
              vec2 uv = vec2( gl_PointCoord.x, y_new );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              gl_FragColor = tex;
            } else {
              discard;
            }
          } else if (width<height) {
            float width_rel = width/height;
            float start_rel = (height-width)/(2.0*height);
            float end_rel = start_rel+width_rel;
            if (gl_PointCoord.x>=start_rel && gl_PointCoord.x<=end_rel) {
              float x_new = ((gl_PointCoord.x-start_rel)/width_rel);
              vec2 uv = vec2( x_new, gl_PointCoord.y );
              vec4 tex = texture2D( texture, uv * repeat + vOffset );
              gl_FragColor = tex;
            } else {
              discard;
            }
          } else {
            vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
            vec4 tex = texture2D( texture, uv * repeat + vOffset );
            gl_FragColor = tex;
          }
        }`
      }

    // material
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
      transparent: true,
    })

    let point = new THREE.Points(geometry, material)
    point.frustumCulled = false

    this.scene.children[1].visible = false
    this.scene.children[1].add(point)
  }


  highlightPoint(sprite_index, digit_index, full_index) {
    let { algorithm_choice} = this.props

    let point = this.scene.children[1].children[0]

    let embedding = this.props.embedding_stack.slice()[algorithm_choice][full_index]
    //[full_index]

    let vert = new THREE.Vector3(embedding[0], embedding[1], 0)
    let vertices = [vert]

    var offsets = new Float32Array(2) // 2 coordinates per point

    let x = ((digit_index % this.props.sprite_side_x) * this.props.sprite_image_width) / this.props.sprite_actual_size
    let y = (Math.floor(digit_index / this.props.sprite_side_y) * this.props.sprite_image_height) / this.props.sprite_actual_size
    offsets[0] = x
    offsets[1] = y

    point.geometry.attributes.position.copyVector3sArray(vertices)
    point.geometry.attributes.position.needsUpdate = true // required after the first render
    point.geometry.attributes.offset.array = offsets
    point.geometry.attributes.offset.needsUpdate = true // required after the first render

    // need to set attributes on geometry and uniforms on material
    point.material.uniforms.texture.value = this.textures[sprite_index]
  }

  removeHighlights() {
    let highlight_container = this.scene.children[1]
    let highlights = highlight_container.children
    highlight_container.remove(...highlights)
  }

  checkIntersects(mouse_position) {
    let { width, height, sidebar_ctx, sidebar_image_size_width, sidebar_image_size_height } = this.props

    function mouseToThree([mouseX, mouseY]) {
      return new THREE.Vector3(
        (mouseX / width) * 2 - 1,
        -(mouseY / height) * 2 + 1,
        1
      )
    }

    function sortIntersectsByDistanceToRay(intersects) {
      return _.sortBy(intersects, 'distanceToRay')
    }

    let mouse_vector = mouseToThree(mouse_position)
    this.raycaster.setFromCamera(mouse_vector, this.camera)
    this.raycaster.params.Points.threshold = 0.5
    let intersects = this.raycaster.intersectObjects(
      this.scene.children[0].children
    )
    if (intersects[0]) {
      let sorted_intersects = sortIntersectsByDistanceToRay(intersects)
      let intersect = sorted_intersects[0]
      let sprite_index = intersect.object.userData.sprite_index
      let digit_index = intersect.index
      let full_index = sprite_index * this.props.sprite_size + digit_index
      this.props.setHoverIndex(full_index)
      this.highlightPoint(sprite_index, digit_index, full_index)
      this.scene.children[1].visible = true

      sidebar_ctx.fillRect(0, 0, sidebar_image_size_width, sidebar_image_size_height)
      sidebar_ctx.drawImage(
        this._images[sprite_index],
        // source rectangle
        (digit_index % this.props.sprite_side_x) * this.props.sprite_image_width,
        Math.floor(digit_index / this.props.sprite_side_y) * this.props.sprite_image_height,
        this.props.sprite_image_width,
        this.props.sprite_image_height,
        // destination rectangle
        0,
        0,
        sidebar_image_size_width,
        sidebar_image_size_height
      )
    } else {
      this.props.setHoverIndex(null)
      this.scene.children[1].visible = false
      sidebar_ctx.fillRect(0, 0, sidebar_image_size_width, sidebar_image_size_height)
    }
  }

  handleMouse() {
    let view = d3.select(this.renderer.domElement)

    this.raycaster = new THREE.Raycaster()
    view.on('mousemove', () => {
      let [mouseX, mouseY] = d3.mouse(view.node())
      let mouse_position = [mouseX, mouseY]
      

      this.checkIntersects(mouse_position)
    })
  }

  init() {
    let { width, height,sidebar_ctx } = this.props

    this.scene = new THREE.Scene()

    let vFOV = 75
    let aspect = width / height
    let near = 0.01
    let far = 1000

    this.camera = new THREE.PerspectiveCamera(vFOV, aspect, near, far)

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x111111, 1)
    this.renderer.setSize(width, height)
    this.mount.appendChild(this.renderer.domElement)
    

    this.addPoints()

    this.addBlankHighlightPoints()

    this.setUpCamera()

    this.animate()
    
    this.handleMouse()
  }

  animate() {
    requestAnimationFrame(this.animate)
    TWEEN.update()
    this.renderer.render(this.scene, this.camera)
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps) {
    let { width, height } = this.props
    if (width !== prevProps.width || height !== prevProps.height) {
      this.handleResize(width, height)
    }
    if (prevProps.algorithm_choice !== this.props.algorithm_choice) {
      this.changeEmbeddings(
        prevProps.algorithm_choice,
        this.props.algorithm_choice
      )
    }
    if (prevProps.label_choice !== this.props.label_choice) {
      this.changeLabels(
        this.props.label_choice
      )
    }
  }

  componentWillUnmount() {
    this.mount.removeChild(this.renderer.domElement)
  }

  render() {
    let { width, height } = this.props
    
    return (
      <div
        style={{ width: width, height: height, overflow: 'hidden' }}
        ref={mount => {
          this.mount = mount
        }}
      />
    )
  }
}

export default Projection
