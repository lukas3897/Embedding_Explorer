import React, { Component } from 'react'
import Parser from 'html-react-parser';
function GenerateTable(label,description_stack,color_array_stack) {
  //Build an array containing Customer records.
  var description_array = new Array();
  description_array.push(["Range", "Description"]);
  for (var i = 0; i < description_stack[label].description.length; i++) {
    description_array.push([description_stack[label].ranges[i][0]+':'+description_stack[label].ranges[i][1], description_stack[label].description[i]]);
  }

  //Create a HTML Table element.
  var table = document.createElement("TABLE");
  table.border = "1";
  

  //Get the count of columns.
  var columnCount = description_array[0].length;

  //Add the header row.
  var row = table.insertRow(-1);
  for (var i = 0; i < columnCount; i++) {
      var headerCell = document.createElement("TH");
      headerCell.innerHTML = description_array[0][i];
      row.appendChild(headerCell);
  }

  //Add the data rows.
  for (var i = 1; i < description_array.length; i++) {
      row = table.insertRow(-1);
      for (var j = 0; j < columnCount; j++) {
          var cell = row.insertCell(-1);
          cell.innerHTML = description_array[i][j];
          if (j==0){
            
            if (description_stack[label].ranges[i-1][0]==description_stack[label].ranges[i-1][1]){
              bg_image_text = 'rgba('+color_array_stack[label][description_stack[label].ranges[i-1][0]]+')';
              cell.style.backgroundColor = bg_image_text;
            }
            else{
              var bg_image_text = 'linear-gradient(to right';
              for (var j_in = description_stack[label].ranges[i-1][0]; j_in <= description_stack[label].ranges[i-1][1]; j_in++) {
                bg_image_text = bg_image_text +', rgba('+color_array_stack[label][j_in]+')';
              }
              bg_image_text = bg_image_text+')';
              cell.style.backgroundImage = bg_image_text;
            }
            
            
          }
      }
  }
  table.rows[0].cells[0].width= '100px';
  var dvTable = document.getElementById("dvTable");
  dvTable.innerHTML = "";
  dvTable.appendChild(table);
}

class Sidebar extends Component {
  componentDidMount() {
    this.props.setSidebarCanvas(this.side_canvas)
    this.handleSelectAlgorithm = this.handleSelectAlgorithm.bind(this)
    this.handleSelectLabel = this.handleSelectLabel.bind(this)
    GenerateTable(this.props.label_choice,this.props.description_stack,this.props.color_array_stack)
  }

  handleSelectAlgorithm(e) {
    let v = e.target.value
    this.props.selectAlgorithm(v)
  }

  handleSelectLabel(e) {
    let v = e.target.value
    this.props.selectLabel(v)
    let i = this.props.label_options.indexOf(v)
    GenerateTable(i,this.props.description_stack,this.props.color_array_stack)
  }

  render() {
    let {
      sidebar_orientation,
      sidebar_image_size_width,
      sidebar_image_size_height,
      grem,
      p,
      hover_index,
      label_stack,
      color_array_stack,
      description_stack,
      algorithm_options,
      algorithm_choice,
      label_options,
      label_choice,
    } = this.props

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
        }}
      >
        <div>
          {' '}
          <div
            style={{
              padding: grem / 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>Algorithm:</div>
            <select
              onChange={this.handleSelectAlgorithm}
              value={algorithm_options[algorithm_choice]}
            >
              {algorithm_options.map((option, index) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              padding: grem / 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>Label Type:</div>
            <select
              onChange={this.handleSelectLabel}
              value={label_options[label_choice]}
            >
              {label_options.map((option, index) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection:
                sidebar_orientation === 'horizontal' ? 'row' : 'column',
            }}
          >
            <div>
              <canvas
                ref={side_canvas => {
                  this.side_canvas = side_canvas
                }}
                width={sidebar_image_size_width}
                height={sidebar_image_size_height}
              />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div
                style={{
                  background: hover_index
                    ? `rgb(${color_array_stack[label_choice][label_stack[label_choice][hover_index]].join(',')})`
                    : 'transparent',
                  color: hover_index ? '#000' : '#fff',
                  padding: p(grem / 4, grem / 2),
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'all 0.1s linear',
                }}
              >
                <div>Label:</div>
                {hover_index ? <div>{label_stack[label_choice][hover_index]}</div> : null}
              </div>
              <div
                style={{
                  padding: p(grem / 4, grem / 2),
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                Index:
                {hover_index ? <div>{hover_index}</div> : null}
              </div>
              <div id="dvTable"></div>
            </div>
          </div>
        </div>
        <div style={{ padding: grem / 2 }}>
          <div>
          An interactive latent space visualization of traffic scenario embeddings.{' '}
            <button
              onClick={() => {
                this.props.toggleAbout(true)
              }}
            >
              About
            </button>
          </div>
          <div>
            <button
              onClick={() => {
                this.props.toggleImprint(true)
              }}
            >
              Impressum
            </button>
          </div>
          <div>
            <button
              onClick={() => {
                this.props.togglePrivacy(true)
              }}
            >
              Datenschutzerklärung
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default Sidebar
