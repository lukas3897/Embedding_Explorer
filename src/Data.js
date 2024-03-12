import React, { Component } from 'react'
import Layout from './Layout'
import * as _ from 'lodash'
import * as d3 from 'd3'
import { json } from 'd3'

let embedding_string = 'embeddings_'
let label_string = 'labels_'
let color_array_string = 'color_array_'
let description_string = 'description_'

function getJson(){
  return fetch(`${process.env.PUBLIC_URL}/set_up.json`)
  .then((res) => res.json())
  .then((json) => json)
};

async function loadParams(){
  let jsondata
  await getJson().then((temp) =>{
    jsondata = temp
  })
  let object_return = new Object()
  object_return.sprite_side       = jsondata.sprite_side
  object_return.sprite_side_x     = jsondata.sprite_side_x
  object_return.sprite_side_y     = jsondata.sprite_side_y
  object_return.sprite_size       = object_return.sprite_side_x * object_return.sprite_side_y
  object_return.sprite_number     = jsondata.sprite_number
  object_return.sprite_image_size = jsondata.sprite_image_size
  object_return.sprite_image_width= jsondata.sprite_image_width
  object_return.sprite_image_height= jsondata.sprite_image_height
  object_return.sprite_ratio      = object_return.sprite_image_width / object_return.sprite_image_height
  object_return.sprite_actual_size= jsondata.sprite_actual_size
  object_return.algorithm_options = jsondata.embedding_names
  object_return.label_options     = jsondata.label_names
  object_return.embedding_number  = jsondata.embedding_number
  object_return.label_number      = jsondata.label_number
  object_return.colored_images    = jsondata.colored_images
  object_return.zoom_min          = jsondata.zoom_min
  object_return.zoom_mid          = jsondata.zoom_mid
  object_return.zoom_max          = jsondata.zoom_max
  object_return.hoover_size       = jsondata.hoover_size
  return object_return
}

class Data extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sprite_side:null,
      sprite_side_x:null,
      sprite_side_y:null,
      sprite_size: null,
      sprite_number:null,
      sprite_image_size:null,
      sprite_image_width:null,
      sprite_image_height:null,
      sprite_actual_size:null,
      sprite_ratio:null,
      algorithm_options: null,
      label_options:null,
      embedding_number: null,
      label_number:null,
      color_array:null,
      color_array_stack: [],
      description:null,
      description_stack: [],
      embeddings: null,
      embedding_stack: [],
      labels: null,
      label_stack: [],
      colored_images: null,
      zoom_min: null,
      zoom_mid: null,
      zoom_max: null,
      hoover_size: null,
    }
  }

  scaleEmbeddings(embeddings) {
    let xs = embeddings.map(e => Math.abs(e[0]))
    let ys = embeddings.map(e => Math.abs(e[1]))
    let max_x = _.max(xs)
    let max_y = _.max(ys)
    let max = Math.max(max_x, max_y)
    let scale = d3
      .scaleLinear()
      .domain([-max, max])
      .range([-20, 20])
    let scaled_embeddings = embeddings.map(e => [scale(e[0]), scale(e[1])])
    return scaled_embeddings
  }

  componentDidMount() {
    Promise.resolve(loadParams()).then((object_return_val)=>{
      this.setState({
        sprite_side: object_return_val.sprite_side,
        sprite_side_x: object_return_val.sprite_side_x,
        sprite_side_y: object_return_val.sprite_side_y,
        sprite_size: object_return_val.sprite_size,
        sprite_number: object_return_val.sprite_number,
        sprite_image_size: object_return_val.sprite_image_size,
        sprite_image_width: object_return_val.sprite_image_width,
        sprite_image_height: object_return_val.sprite_image_height,
        sprite_actual_size: object_return_val.sprite_actual_size,
        embedding_number: object_return_val.embedding_number,
        label_number: object_return_val.label_number,
        algorithm_options: new Array(object_return_val.embedding_number),
        label_options: new Array(object_return_val.label_number),
        label_stack: new Array(object_return_val.label_number),
        color_array_stack: new Array(object_return_val.label_number),
        description_stack: new Array(object_return_val.label_number),
        embedding_stack: new Array(object_return_val.embedding_number),
        sprite_ratio: object_return_val.sprite_ratio ,
        colored_images: object_return_val.colored_images,
        zoom_min: object_return_val.zoom_min,
        zoom_mid: object_return_val.zoom_mid,
        zoom_max: object_return_val.zoom_max,
        hoover_size: object_return_val.hoover_size,
      })
      // EMBEDDINGS
      if (this.state.embedding_number > 1){
        fetch(`${process.env.PUBLIC_URL}/${embedding_string}0.json`)
        .then(response => response.json())
        .then(jsondata => {
          let scaled_embeddings = this.scaleEmbeddings(jsondata.points)
          let embedding_stack_local =  this.state.embedding_stack.slice()
          let algorithm_options_local =  this.state.algorithm_options.slice()
          embedding_stack_local[0] = scaled_embeddings
          algorithm_options_local[0] = '0__'+jsondata.name
          this.setState({
            embeddings: scaled_embeddings,
            embedding_stack: embedding_stack_local,
            algorithm_options: algorithm_options_local
          })
        })
        for(let i=1;i<this.state.embedding_number; i++){
          fetch(`${process.env.PUBLIC_URL}/${embedding_string}${i}.json`)
          .then(response => response.json())
          .then(jsondata => {
            let scaled_embeddings = this.scaleEmbeddings(jsondata.points)
            let embedding_stack_local =  this.state.embedding_stack.slice()
            let algorithm_options_local =  this.state.algorithm_options.slice()
            embedding_stack_local[i] = scaled_embeddings
            algorithm_options_local[i] = String(i)+'__'+jsondata.name
            this.setState({
              embeddings: scaled_embeddings,
              embedding_stack: embedding_stack_local,
              algorithm_options: algorithm_options_local
            })
          })
        }
      }
      else{
        fetch(`${process.env.PUBLIC_URL}/${embedding_string}0.json`)
        .then(response => response.json())
        .then(jsondata => {
          let scaled_embeddings = this.scaleEmbeddings(jsondata.points)
          let embedding_stack_local =  this.state.embedding_stack.slice()
          let algorithm_options_local =  this.state.algorithm_options.slice()
          embedding_stack_local[0] = scaled_embeddings
          algorithm_options_local[0] = '0__'+jsondata.name
          this.setState({
            embeddings: scaled_embeddings,
            embedding_stack: embedding_stack_local,
            algorithm_options: algorithm_options_local
          })
        })

      }
      // LABELS AND COLORMAP AND DESCRIPTION
      if (this.state.label_number > 1){
        // LABEL
        fetch(`${process.env.PUBLIC_URL}/${label_string}0.json`)
        .then(response => response.json())
        .then(labels => {
          let label_stack_local =  this.state.label_stack.slice()
          label_stack_local[0] = labels
          this.setState({
            labels: labels,
            label_stack: label_stack_local
          })
        })
        for(let i=1;i<this.state.label_number; i++){
          fetch(`${process.env.PUBLIC_URL}/${label_string}${i}.json`)
          .then(response => response.json())
          .then(labels => {
            let label_stack_local =  this.state.label_stack.slice()
            label_stack_local[i] = labels
            this.setState({
              label_stack: label_stack_local
            })
          })
        }
        // COLOR
        fetch(`${process.env.PUBLIC_URL}/${color_array_string}0.json`)
        .then(response => response.json())
        .then(color => {
          let color_array_stack_local =  this.state.color_array_stack.slice()
          color_array_stack_local[0] = color
          this.setState({
            color_array: color,
            color_array_stack: color_array_stack_local
          })
        })
        for(let i=1;i<this.state.label_number; i++){
          fetch(`${process.env.PUBLIC_URL}/${color_array_string}${i}.json`)
          .then(response => response.json())
          .then(color => {
            let color_array_stack_local =  this.state.color_array_stack.slice()
            color_array_stack_local[i] = color
            this.setState({
              color_array_stack: color_array_stack_local
            })
          })
        }
        // DESCRIPTION
        fetch(`${process.env.PUBLIC_URL}/${description_string}0.json`)
        .then(response => response.json())
        .then(description => {
          let description_stack_local =  this.state.description_stack.slice()
          description_stack_local[0] = description
          let label_options_local =  this.state.label_options.slice()
          label_options_local[0] = description.name
          this.setState({
            description: description,
            description_stack: description_stack_local,
            label_options: label_options_local
          })
        })
        for(let i=1;i<this.state.label_number; i++){
          fetch(`${process.env.PUBLIC_URL}/${description_string}${i}.json`)
          .then(response => response.json())
          .then(description => {
            let description_stack_local =  this.state.description_stack.slice()
            description_stack_local[i] = description
            let label_options_local =  this.state.label_options.slice()
            label_options_local[i] = description.name
            this.setState({
              description_stack: description_stack_local,
              label_options: label_options_local
            })
          })
        }
      }
      else{
        // LABEL
        fetch(`${process.env.PUBLIC_URL}/${label_string}0.json`)
        .then(response => response.json())
        .then(labels => {
          let label_stack_local =  this.state.label_stack.slice()
          label_stack_local[0] = labels
          this.setState({
            labels: labels,
            label_stack: label_stack_local
          })
        })
        // COLOR
        fetch(`${process.env.PUBLIC_URL}/${color_array_string}0.json`)
        .then(response => response.json())
        .then(color => {
          let color_array_stack_local =  this.state.color_array_stack.slice()
          color_array_stack_local[0] = color
          this.setState({
            color_array: color,
            color_array_stack: color_array_stack_local
          })
        })
      }
    })
  }

  render() {
    console.log(this.state)
    return this.state.embeddings && this.state.labels ? (
      <Layout
        {...this.state}
      />
    ) : (
      <div style={{ padding: '1rem' }}>Loading data...</div>
    )
  }
}

export default Data
