<template>
    <div class="page-container">
        <a-typography-title>给照片加水印</a-typography-title>
        <a-divider />
        <div style="display: flex;justify-content: space-between">
            <a-upload
                type="primary"
                v-model:file-list="fileList"
                :multiple= "false"
                action=" "
                :before-upload="beforeUpload"
            >
                <a-button  >
                    <template #icon>
                        <UploadOutlined />
                    </template>
                   新建照片
                </a-button>
            </a-upload>
            <a-button  type="primary" @click="download">
                <template #icon>
                    <DownloadOutlined />
                </template>
                下载照片
            </a-button>
        </div>
        <div class="props">
            <a-typography-title :level="3">参数:</a-typography-title>
            <a-form
                :model="photoInfo"
                name="basic"
                :label-col="{ span: 8 }"
                :wrapper-col="{ span: 16 }"
                layout="inline"
            >
                <a-form-item label="型号" name="model"> <a-input v-model:value="photoInfo.model" /></a-form-item>
                <a-form-item label="品牌" name="brand">
                    <a-select
                    v-model:value="photoInfo.brand"
                    @change="changeBrand"
                    style="width: 170px"
                    :options="brandList.map(brand => ({ value: brand }))"
                ></a-select>
                </a-form-item>
                <a-form-item label="参数" name="device"> <a-input v-model:value="photoInfo.device"/></a-form-item>

                <a-form-item label="时间" name="time"> <a-input v-model:value="photoInfo.time" /></a-form-item>
                <a-form-item label="经纬" name="gps"> <a-input v-model:value="photoInfo.gps" /></a-form-item>


            </a-form>
        </div>

        <a-typography-title :level="3">预览</a-typography-title>
        <div id="previewImg" class="img-container">
            <img v-if="imgUrl!==''" class="preview-img" :src="imgUrl" alt="">
            <img v-else class="preview-img " src="../assets/sun.jpeg" alt="">
            <div class="bottom">
                <div class="left">
                    <span class="model" >{{photoInfo.model }}</span>
                    <span class="date">{{photoInfo.time}}</span>
                </div>
                <div class="right">
                    <div class="brand">
<!--                         splicingBrandPath-->
                        <img :src="handleSrc(brandUrl)" alt="">
                    </div>
                    <div class="preview-info-split"></div>
                     <div class="iso-info">
                         <span class="device">{{photoInfo.device}}</span>
                         <span class="gps" >{{photoInfo.gps}}</span>
                     </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, reactive, ref} from 'vue';
import ExifReader from 'exifreader';
import domtoimage from 'dom-to-image'
import { message } from "ant-design-vue";

let imgUrl = ref("")
let brandUrl = ref('apple.svg')

const brandList = [
    "Apple",
    "Canon",
    "Dji",
    "Fujifilm",
    "Huawei",
    "Leica",
    "Xiaomi",
    "Nikon Corporation",
    "Sony",
    "未收录",
]


const changeBrand = () => {
  brandUrl.value = photoInfo.value.brand === "未收录" ? "unknow.svg" : `${photoInfo.value.brand.toLowerCase()}.svg`
}
function handleSrc(brandName) {
  return new URL(`../assets/brand/${brandName}`, import.meta.url,).href
}

const photoInfo = ref({
    brand:'Apple',
    device: '4.25mm f/1.8 1/805 ISO 32',
    time: '2024:03:16 17:52:23',
    model: 'iPhone 11',
    gps: '31°31\'11.73"N 120°16\'5.18"E'
})
const fileList = ref([])

const beforeUpload = file => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // onload 当某个资源（如图片）或者整个文档加载完成时触发 onloadend 当加载操作结束时（无论成功还是失败）触发
    reader.onloadend = () => {
      ExifReader.load(reader.result).then(res => {
        console.log('res',res)
        const {
          FocalLength,FNumber,ExposureTime,ISOSpeedRatings,GPSLatitude,GPSLongitude,GPSLatitudeRef,GPSLongitudeRef
        } = res
        photoInfo.value.model = res.Model?.value[0]
        photoInfo.value.time = res.DateTime?.value[0]
        photoInfo.value.device = `${FocalLength.description} ${FNumber.description} ${ExposureTime.description} ISO ${ISOSpeedRatings.value}`
        const latitudeStr= gpsToStr(GPSLatitude.value)
        const longitudeStr= gpsToStr(GPSLongitude.value)
        photoInfo.value.gps = `${latitudeStr} ${GPSLatitudeRef.value[0]}   ${longitudeStr} ${GPSLongitudeRef.value[0]}`
        function gpsToStr(gps) {
         return  gps.reduce((pre,[fenzi,fenmu],index) => {
            const num = fenzi / fenmu
            let str = ``
            if(index === 0) {
              str = `${num}°`
            }else if(index === 1){
              str = `${num}'`
            }else {
              str = `${num}"`
            }
            return pre+str
          },'')
        }
        imgUrl.value = reader.result;
      }).catch(err => {
        console.log('err',err)
        message.error('无法识别该图片的exif信息，请换一张')
      })
      fileList.value.splice(0,fileList.value.length)
      return false
    };
};
const download = () => {
  const previewDom = document.getElementById('previewImg')
  const zoomRatio = 4;
  // 转成 blob 二进制 格式下载图片
  domtoimage
      .toJpeg(previewDom, {
        quality: 0.8,
        width: previewDom.clientWidth * zoomRatio,
        height: previewDom.clientHeight * zoomRatio,
        style: {
          transform: "scale(" + zoomRatio + ")",
          "transform-origin": "top left",
        },
      })
      .then((data) => {
        // window.atob 将base64编码的数据解码
        const binaryString = window.atob(data.split(",")[1]);
        console.log("binaryString", binaryString)
        const length = binaryString.length;
        const binaryArray = new Uint8Array(length);

        for (let i = 0; i < length; i++)
          binaryArray[i] = binaryString.charCodeAt(i);

        return new Blob([binaryArray], {
          type: "image/jpeg",
        });
      })
      .then((data) => window.URL.createObjectURL(data))
      .then((data) => {
        const link = document.createElement("a");

        link.download = Date.now() + ".jpg";
        link.href = data;
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  // 直接以base64格式下载图片
  domtoimage
    .toPng(previewDom, {
      quality: 0.8,
      width: previewDom.clientWidth * zoomRatio,
      height: previewDom.clientHeight * zoomRatio,
      style: {
        transform: "scale(" + zoomRatio + ")",
        "transform-origin": "top left",
      },
    })
    .then((baseUrl) => {
      // 在使用 Base64 数据 URL 下载图片时，图片数据会被编码为字符串，这可能会增加数据的大小。而使用 Blob 对象下载则是直接下载原始的二进制数据，因此可能会更高效地处理大型图片。
      const link = document.createElement("a");
      link.download = Date.now() + ".png";
      link.href = baseUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
}

</script>

<style lang="scss" scoped>
.page-container {
    width: 800px;
    .img-container {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        img  {
            max-width: 100%;
        }
        .bottom {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            background-color: #fff;
            .left {
              display: flex;
              flex-direction: column;
              .model {
                  text-align: left;
                  font-size: 26px;
                  font-weight: bolder;
              }
              .date {
                  text-align: left;
                  font-size: 14px;
                  color: #888888;
              }
            }
            .right {
                display: flex;
                .brand {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    img {
                      height: 39px;
                    }
                }
                .preview-info-split {
                    border-left: 2px solid #ddd;
                    height: 39px;
                    margin-top: 6px;
                    margin-right: 12px;
                    margin-left: 12px;
                }
                .iso-info {
                    display: flex;
                    flex-direction: column;
                    .device {
                        text-align: left;
                        font-weight: bold;
                        font-size: 18px;
                    }
                    .gps {
                        text-align: left;
                        color: #aaa;
                        font-size: 14px;
                    }
                }

            }
        }
    }
}

</style>
<style>
.ant-btn,
.props .ant-select-selector {
    border-radius: 0;
}

.props .ant-form-inline .ant-form-item {
    margin-bottom: 10px;
}
.ant-input {
    width: 170px;
    border-radius: 0;
}
</style>
