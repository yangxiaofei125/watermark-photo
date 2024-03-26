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
                <a-button>
<!--                    <upload-outlined></upload-outlined>-->
                   新建照片
                </a-button>
            </a-upload>
            <a-button  type="primary" @click="download">
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
                        <img :src="'src/assets/brand/'+ brandUrl" alt="">
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
import piexifjs, { piexif } from 'piexifjs'
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
const photoInfo = ref({
    brand:'Apple',
    device: '4.25mm f/1.8 1/805 ISO 32',
    time: '2024:03:16 17:52:23',
    model: 'iPhone 11',
    gps: '31°31\'11.73"N 120°16\'5.18"E'
})
const fileList = ref([])

const isoInfoStr = (exifInfo) => {
    if(Object.keys(exifInfo).length === 0) return null
    return `${exifInfo.L}mm f/${exifInfo.F} ${exifInfo.S} ISO ${exifInfo.ISO} `
}
const gpsStr = (gps) => {
    if(!gps) return ''
    const weidu = gps[1].reduce((pre,[fenzi,fenmu],index) => {
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
    const jingdu = gps[3].reduce((pre,[fenzi,fenmu],index) => {
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
    return weidu + gps[0] +' '+jingdu+ gps[2]
}
const changeBrand = () => {
  brandUrl.value = photoInfo.value.brand === "未收录" ? "unknow.svg" : `${photoInfo.value.brand.toLowerCase()}.svg`
}

//piexifjs解析出来的Exif参数对象可读性不强，需要格式化处理一下
const parseExifData = (exifData) => {
    if(!exifData) return null
    const M = exifData['0th'][piexif.ImageIFD.Model]
    const F = exifData.Exif[piexif.ExifIFD.FNumber]
    const S = exifData.Exif[piexif.ExifIFD.ExposureTime]
    const ISO = exifData.Exif[piexif.ExifIFD.ISOSpeedRatings]
    const L = exifData.Exif[piexif.ExifIFD.FocalLength]
    const LEN = exifData.Exif[piexif.ExifIFD.LensModel]
    const T = exifData.Exif[piexif.ExifIFD.DateTimeOriginal]
    const GPS = Object.values(exifData.GPS).slice(0,4)
    return {
        M: M || null,
        F: F && F[0] && F[1] ? F[0] / F[1] : null,
        S: S && S[0] && S[1] ? S[0] +'/'+ S[1] : null,
        ISO: ISO || null,
        L: L && L[0] && L[1] ? L[0] / L[1] : null,
        LEN:LEN||null,
        T:T||null,
        GPS: GPS || null
    }
}
const beforeUpload = file => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // onload 当某个资源（如图片）或者整个文档加载完成时触发 onloadend 当加载操作结束时（无论成功还是失败）触发
    reader.onloadend = () => {
      try {
        const exifData =  piexifjs.load(reader.result)
        if(Object.keys(exifData.Exif).length === 0) {
          message.error('无法识别该图片特定信息，请换一张')
          return false;
        }
        const exifFormatData = parseExifData(exifData)
        photoInfo.value.model = exifFormatData.M
        photoInfo.value.time = exifFormatData.T
        photoInfo.value.device = isoInfoStr(exifFormatData)
        photoInfo.value.gps = gpsStr(exifFormatData.GPS)
        imgUrl.value = reader.result;
        fileList.value.splice(0,fileList.value.length)
        return false
      } catch (error) {
        message.error('无法识别该图片特定信息，请换一张')
        fileList.value.splice(0,fileList.value.length)
        return false;
      }
    };
};
const download = () => {
  const previewDom = document.getElementById('previewImg')
  const zoomRatio = 4;
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
        const binaryString = window.atob(data.split(",")[1]);
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
.ant-input,
.props .ant-select-selector {
    border-radius: 0;
}

.props .ant-form-inline .ant-form-item {
    margin-bottom: 10px;
}
</style>
