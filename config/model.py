#!/usr/bin/env python
# coding: utf-8

# In[3]:


from keras.layers import Input,Lambda,Dense,Flatten
from keras.models import Model,Sequential,load_model
from keras.applications.resnet50 import ResNet50 ,preprocess_input
from keras.preprocessing import image
from keras.preprocessing.image import ImageDataGenerator
from keras.preprocessing.image import load_img
from glob import glob
import numpy as np
import pandas as pd
import tensorflow as tf


# In[2]:


model=load_model('Indian_currency_predict.h5')


# In[4]:


def preprocess_img(img):
    
    img=image.load_img(img,target_size=(224,224))
    
    img=image.img_to_array(img)
    
    img=np.expand_dims(img,axis=0)
    
    # normalisation
    
    img=preprocess_input(img)
    
    return img


# In[6]:


idx_to_note={}
idx_to_note[0]=10
idx_to_note[1]=20
idx_to_note[2]=50
idx_to_note[3]=100
idx_to_note[4]=200
idx_to_note[5]=500
idx_to_note[6]=2000

path ="../money/"

img=preprocess_img(path+"10-1.jpg")

label=model.predict(img)

print(idx_to_note[label.argmax()])


# In[ ]:




