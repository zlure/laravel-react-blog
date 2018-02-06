import React, { Component } from 'react';
import { Icon, Form, Input, Button, Upload, message } from 'antd';
const FormItem = Form.Item;
import BraftEditor from 'braft-editor'
import 'braft-editor/dist/braft.css'
import styles from "./ArticleForm.css"

class CoverUploader extends React.Component {
  render() {
    const props = {
      action: 'z/upload',
      listType: 'picture',
      defaultFileList: [...this.props.coverList],
      headers:{
        'X-CSRF-TOKEN':document.head.querySelector('meta[name="csrf-token"]').content
      }
    };
    return (
      <div>
        <Upload {...props} onChange={this.props.coverChanged}>
          <Button>
            <Icon type="upload" /> 点此上传
          </Button>
        </Upload>
      </div>
    )
  }
}

export class ArticleForm extends React.Component {
  constructor(props) {
    super();
    this.state = {
      //封面文件列表缓存
      coverList:[],
      //表单
      title: props.article ? props.article.title : '',
      cover: props.article ? props.article.cover : '',
      content: props.article ? props.article.content : ''
    };
  }
  componentWillReceiveProps(nextProps) {
      this.setState({
        title: nextProps.article.title,
        cover: nextProps.article.cover,
        content: nextProps.article.content,
      });
  }
  handelTitleChange = (e) => {
    let title = this.refs.title.input.value
    this.setState({title: title})
  }
  handleHTMLChange = (html) => {
    this.setState({content: html})
  }
  uploadFn = (param) => {
    const serverURL = 'z/upload'
    const xhr = new XMLHttpRequest
    const fd = new FormData()
    // libraryId可用于通过mediaLibrary示例来操作对应的媒体内容
    console.log(param.libraryId)
    const successFn = (response) => {
      // 假设服务端直接返回文件上传后的地址
      // 上传成功后调用param.success并传入上传后的文件地址
      param.success({
        url: JSON.parse(xhr.responseText).ObjectURL
      })
    }
    const progressFn = (event) => {
      // 上传进度发生变化时调用param.progress
      param.progress(event.loaded / event.total * 100)
    }
    const errorFn = (response) => {
      // 上传发生错误时调用param.error
      param.error({
        msg: 'unable to upload.'
      })
    }
    xhr.upload.addEventListener("progress", progressFn, false)
    xhr.addEventListener("load", successFn, false)
    xhr.addEventListener("error", errorFn, false)
    xhr.addEventListener("abort", errorFn, false)

    fd.append('file', param.file)
    xhr.open('POST', serverURL, true)
    xhr.setRequestHeader('X-CSRF-TOKEN', document.head.querySelector('meta[name="csrf-token"]').content);
    xhr.send(fd)
  }
  coverChanged(event) {
    if (event.file.response) {
      this.setState({
        coverList:event.fileList,
        cover:event.file.response.ObjectURL
      })
    }
  }
  handleSubmit = (e) => {
    var that = this
    e.preventDefault();
    let title = this.state.title
    let cover = this.state.cover
    let content = this.state.content
    if (title == '') {
      message.error('标题不能为空');
    }else {
      //创建文章
      axios.post('z/articles', {
        title:title,
        cover:cover,
        content:content,
      })
      .then(function (response) {
        console.log(response);
        if (response.status == 200) {
          message.success(response.data.message)
          location.replace('#/articles')
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }
  render() {
    const formItemLayout = {
      wrapperCol: { offset: 4, span: 16 },
    };
    const editorProps = {
      height: 350,
      contentFormat:'html',
      initialContent: this.state.content,
      onHTMLChange: this.handleHTMLChange,
      media:{
        uploadFn:this.uploadFn
      },
      controls:[
        'undo', 'redo', 'split', 'font-size', 'font-family', 'text-color',
        'bold', 'italic', 'underline', 'strike-through', 'emoji', 'superscript',
        'subscript', 'text-align', 'split', 'headings', 'list_ul', 'list_ol',
        'blockquote', 'code', 'split', 'link', 'split', 'media'
      ],
      extendControls: [{
        type: 'modal',
        text: '更新封面',
        modal: {
          title: '上传文章封面图片',
          showClose: true,
          showCancel: true,
          showConfirm: true,
          confirmable: true,
          onConfirm: () => console.log(1),
          onCancel: () => console.log(2),
          onClose: () => console.log(3),
          children: (
            <div style={{width: 480, height: 160, padding: 30}}>
              <CoverUploader coverList={this.state.coverList} coverChanged={this.coverChanged.bind(this)} />
            </div>
          )
        }
      }]
    };
    return (
      <Form>
        <FormItem
          {...formItemLayout}>
          <Input
            prefix={<Icon type="info-circle-o" />}
            placeholder="输入文章标题"
            ref="title"
            value={this.state.title}
            onChange={this.handelTitleChange} />
        </FormItem>
        <FormItem {...formItemLayout}>
          <div  style={{ borderRadius: 5, boxShadow: 'inset 0 0 0 0.5px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.1)'}}>
            <BraftEditor {...editorProps}/>
          </div>
        </FormItem>
        <FormItem {...formItemLayout} style={{textAlign:'right'}}>
          <Button
            onClick={this.props.handleSubmit.bind(this, {
              title:this.state.title,
              cover:this.state.cover,
              content:this.state.content
            })}
            type="primary"
            htmlType="submit"
            icon="form"> 保存
          </Button>
        </FormItem>
      </Form>
    )
  }
}