import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import JSONFormatter from 'json-formatter-js'
import { MyHttpService } from '../common/myHttpService';

@Component({
  selector: 'main-component',
  templateUrl: './main.component.html'
})
export class MainComponent {
	api:any = {};
	tagId:Number = 0;
  popWindowId = 0;
  voObjs;
  searchKey;
  objDefines = {properties:null};
  formData = {};
  @ViewChild('objDefined') objDefinedContainer: ElementRef
  @ViewChild('objResult') objResultContainer: ElementRef

  constructor(private myHttpService: MyHttpService) {
  }

  //解析定义类的名称
  getDefinName(str) {
    if(null == str) return "";
    return str.replace(/^#.*\//, "");
  }

  //切换标签页
  showTag(tagId:Number) {
  	this.tagId = tagId;
  }

  ngOnInit() {
    
  }

  //显示API详情
  showApiDescription(apiInfo) {
  	this.api = apiInfo.api || {};
    this.voObjs = apiInfo.voObjs;
    this.formData = {};

    console.log(apiInfo)
  }
 

  //参数列表中，如果参数为对象点击查看参数对象详情
  showObj(objName) {
    if(!objName || !objName.voObjName) return;

    objName = objName.voObjName;
    this.popWindowId = 1;

    this.objDefines = this.voObjs[this.getDefinName(objName)];

    let el = this.objDefinedContainer.nativeElement 
    el.innerHTML = "";
    const formatter = new JSONFormatter(this.objDefines.properties);

    el.appendChild(formatter.render());
  } 




  parseParam(obj) {
    let res = {
      type : 1, //1普通文本 2A标签
      text : "",
      voObjName:null
    };
      //处理普通数组参数,基本类型
    if('array'.toLocaleLowerCase() == obj.type && obj.items) {
        if(obj.items.type) {
          res.text = obj.type + "<" + obj.items.type + ">";
        } else if(obj.items && obj.items.$ref) {  //处理对象数组参数
          obj.schema = {
            $ref : obj.items.$ref
          }
          res.type = 2;
          res.voObjName = obj.schema.$ref;
          res.text = obj.type + "<" + this.getDefinName(obj.schema.$ref)+ ">";
        }
    } else if(obj.schema) {  //处理普通对象参数
        let $ref = null;
        if(obj.schema && 'array' == obj.schema.type) {
          $ref = obj.schema.items.$ref;
          res.text = "array<" + this.getDefinName($ref) + ">";
        } else {
          $ref = obj.schema.$ref;
          res.text = this.getDefinName($ref);
        }
        res.type = 2;
        res.voObjName = $ref;
        

    }  else { //普通数据类型
        res.text = obj.type;
    } 

    return res;
  }


  //debug时显示的文本框类型
  getShowType(item) {
    if(item.in == "body") {
      return 'textarea';
    } else {
      return 'text';
    }
  }

    

  close() {
    this.popWindowId = 0;
  }



  //发送数据到后台接口
  sendData() {
    let url = this.api.path;
    let params = [];
    let headers = [];
    let flag:boolean = true;
    let requiredMsg = "";
    this.showResult(null);
    

    if(this.api && this.api.params) {
      this.api.params.forEach(item => {
        if(item.required && !this.formData[item.name]) {
          requiredMsg += "[" + item.name + "]字段必填\r\n";
          flag = false;
          return;
        }
        if(item.in == 'body' && item.schema) {
          params = this.strToJSON(this.formData[item.name]);          

        } else if(item.in == 'path'){
          var reg = new RegExp("{" + item.name + "}");
          url = url.replace(reg, this.formData[item.name]);
        } else if(item.in == 'header'){
          headers.push({
              key : item.name,
              value : this.formData[item.name]
          })
        } else {
          params.push({
              key : item.name,
              value : this.formData[item.name]
          })
          headers.push({
            key : "Content-Type",
            value : 'application/x-www-form-urlencoded'
          })
        }
      })
    }

    if(this.api.method && flag == true) {
      this.myHttpService.sendData(this.api.method, url, headers, params).then(res => {
        this.showResult(res);
      })
    }
    if(Object.is(flag,false)) {
      alert(requiredMsg);
    }
   
  }


  showResult(obj) {
    let el = this.objResultContainer.nativeElement 
    el.innerHTML = "";

    if(!obj) return;
  
    const formatter = new JSONFormatter(obj);

    el.appendChild(formatter.render());
  }



    strToJSON (str) {
      let res ;
        try {
          res = (new Function("return " + str))(); 
        } catch(e) {
          alert("JSON格式错误")
        }
        return res;
    };
 
}
