import '../../helpers/iframeLoader.js'
import axios from 'axios';
import React, { Component } from 'react';
import DOMHelper from '../../helpers/dom-helper'

export default class Editor extends Component {
    constructor() {
        super();

        this.currentPage = 'index.html'

        this.state = {
            pageList: [],
            newPageName:''
        }

        this.createNewPage = this.createNewPage.bind(this);
    }
    componentDidMount() {
        this.init(this.currentPage);
    }

    loadPageList() {
        axios
            .get("./api")
            .then(res => this.setState({
                pageList: res.data
            }))
            
    }

    createNewPage(){
        axios
            .post("./api/createNewPage.php", {"name": this.state.newPageName})
            .then(this.loadPageList())
            .catch(() => alert('The page already exist'));
    }

    deletePage(page) {
        axios
            .post("./api/deletePage.php", {"name": page})
            .then(this.loadPageList())
            .catch(() => alert('The page is not exist'));
    }

    init(page) {
        this.iframe = document.querySelector('iframe');
        this.open(page);
        this.loadPageList();
    }

    open(page) {
        this.currentPage = page;

        axios
            .get(`../${page}?rnd=${Math.random()}`)
            .then(res => DOMHelper.parseStrToDOM(res.data))
            .then(DOMHelper.wrapTextNodes)
            .then(dom => {
                this.virtualDom = dom;
                return dom;
            })
            .then(DOMHelper.serializeDOMToString)
            .then(html => axios.post("./api/saveTempPage.php", {
                html
            }))
            .then(() => this.iframe.load("../temp.html"))
            .then(() => this.enableEditing())
    }

    save() {
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDOMToString(newDom);
        axios
            .post('api/savePage.php', { pageName: this.currentPage, html})
    }

    enableEditing() {
        this.iframe.contentDocument.body.querySelectorAll("text-editor").forEach(element => {
            element.contentEditable = "true";
            element.addEventListener("input", () => {
                this.onTextEdit(element);
            })
        });
    }

    onTextEdit(element) {
        const id = element.getAttribute('nodeid');
        this.virtualDom.body.querySelector(`[nodeid="${id}"]`).innerHTML = element.innerHTML;
    }


    render(){

        return (
            <>
                <button onClick={() => this.save()}> Click </button>
                <iframe src={this.currentPage} frameBorder="0"></iframe>
                {/* <>
                    <input onChange={(e) => {this.setState({newPageName: e.target.value})}} 
                   type="text" />
                  <button onClick={this.createNewPage}>Create page</button>
                  {pages}
                 </>*/}
            </>
        )

    }
}
