from keras.layers import Input,Lambda,Dense,Flatten
from keras.models import Model,Sequential,load_model
from keras.applications.vgg16 import VGG16 ,preprocess_input
from keras.preprocessing import image
from keras.preprocessing.image import ImageDataGenerator
from glob import glob
import numpy as np
import pandas as pd
import tensorflow as tf


model=load_model('./Indian_currency_recog.h5')


from keras.preprocessing.image import load_img


def preprocess_img(img):
    
    img=image.load_img(img,target_size=(224,224))
    
    img=image.img_to_array(img)
    
    img=np.expand_dims(img,axis=0)
    
    # normalisation
    
    img=preprocess_input(img)
    
    return img

def Currency_predict(path):
    
    idx_to_cur={}
    idx_to_cur[0]=10
    idx_to_cur[1]=20
    idx_to_cur[2]=50
    idx_to_cur[3]=100
    idx_to_cur[4]=200
    idx_to_cur[5]=500
    idx_to_cur[6]=2000
    idx_to_cur[7]="Invalid Currency"

    img = preprocess_img(path)

    label=model.predict(img)
    return idx_to_cur[label.argmax()]
